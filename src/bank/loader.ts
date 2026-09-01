import { Exercise } from '../types';
import { EXERCISES } from './exercises';

export function loadExercises(): Exercise[] {
  return EXERCISES;
}

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function exerciseCount(): number {
  return EXERCISES.length;
}

/** 运行时校验题库结构，返回问题列表（空数组 = 通过） */
export function validateExercises(exercises: Exercise[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const e of exercises) {
    if (!e.id) {
      errors.push('存在缺少 id 的题目');
      continue;
    }
    if (ids.has(e.id)) errors.push(`${e.id}: id 重复`);
    ids.add(e.id);
    if (!e.title) errors.push(`${e.id}: 缺少 title`);
    if (!e.topic) errors.push(`${e.id}: 缺少 topic`);
    if (!e.starterCode) errors.push(`${e.id}: 缺少 starterCode`);
    if (!e.testCases || e.testCases.length === 0) errors.push(`${e.id}: 缺少 testCases`);
    for (const tc of e.testCases ?? []) {
      if (tc.expectedOutput === undefined) errors.push(`${e.id}: 用例缺少 expectedOutput`);
    }
  }
  return errors;
}
