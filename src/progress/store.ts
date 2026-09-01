// 进度状态持久化：JSON 原子写，存 globalStorageUri
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProgressState, Exercise } from '../types';

export class ProgressStore {
  private data: ProgressState;
  private filePath: string;

  constructor(context: vscode.ExtensionContext) {
    this.filePath = path.join(context.globalStorageUri.fsPath, 'progress.json');
    this.data = this.load();
  }

  private load(): ProgressState {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        completed: parsed.completed ?? {},
        currentExerciseId: parsed.currentExerciseId,
        streak: parsed.streak ?? 0,
        totalCompleted: parsed.totalCompleted ?? 0,
      };
    } catch {
      return { completed: {}, streak: 0, totalCompleted: 0 };
    }
  }

  get(): ProgressState {
    return this.data;
  }

  setCurrentExercise(id: string): void {
    this.data.currentExerciseId = id;
    this.save();
  }

  record(exerciseId: string, passed: boolean): void {
    const prev = this.data.completed[exerciseId];
    this.data.completed[exerciseId] = {
      passed,
      attempts: (prev?.attempts ?? 0) + 1,
      ts: Date.now(),
    };
    this.data.totalCompleted = Object.values(this.data.completed).filter((r) => r.passed).length;
    this.save();
  }

  /** 返回有失败记录的薄弱主题（按失败次数降序） */
  weakTopics(exercises: Exercise[]): string[] {
    const byTopic = new Map<string, { failed: number }>();
    for (const ex of exercises) {
      const rec = this.data.completed[ex.id];
      if (rec && !rec.passed) {
        byTopic.set(ex.topic, { failed: (byTopic.get(ex.topic)?.failed ?? 0) + 1 });
      }
    }
    return [...byTopic.entries()]
      .sort((a, b) => b[1].failed - a[1].failed)
      .map(([topic]) => topic);
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.data), 'utf8');
    } catch {
      /* 忽略写入失败 */
    }
  }
}
