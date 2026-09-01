// 构建 RAG 文档集合（knowledge / exercises / history / mistakes）
import { Exercise, ProgressState } from '../types';
import { RagDoc } from './vectorStore';

export function buildDocs(exercises: Exercise[], progress: ProgressState): RagDoc[] {
  const docs: RagDoc[] = [];

  // knowledge：按主题聚合参考讲解
  const byTopic = new Map<string, string[]>();
  for (const ex of exercises) {
    if (!byTopic.has(ex.topic)) byTopic.set(ex.topic, []);
    byTopic.get(ex.topic)!.push(ex.explanation);
  }
  for (const [topic, exps] of byTopic) {
    docs.push({ ns: 'knowledge', id: `topic:${topic}`, text: `${topic}：${exps.join(' ')}`, meta: { topic } });
  }

  // exercises：每道题
  for (const ex of exercises) {
    docs.push({
      ns: 'exercises',
      id: ex.id,
      text: `${ex.title}：${ex.description}`,
      meta: { topic: ex.topic, difficulty: ex.difficulty },
    });
  }

  // history / mistakes：来自进度
  for (const [exId, rec] of Object.entries(progress.completed)) {
    const ex = exercises.find((e) => e.id === exId);
    const topic = ex?.topic ?? '';
    const title = ex?.title ?? exId;
    if (rec.passed) {
      docs.push({ ns: 'history', id: `hist:${exId}`, text: `已通过练习：${title}（${topic}）`, meta: { exerciseId: exId, topic } });
    } else {
      docs.push({ ns: 'mistakes', id: `mist:${exId}`, text: `未通过练习：${title}（${topic}），尝试 ${rec.attempts} 次`, meta: { exerciseId: exId, topic } });
    }
  }

  return docs;
}
