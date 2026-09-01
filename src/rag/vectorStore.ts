// 向量存储：全内存 cosine + JSON 持久化（数据量小，无需数据库引擎）
import * as fs from 'fs';
import * as path from 'path';

export interface RagDoc {
  ns: string;
  id: string;
  text: string;
  meta?: Record<string, unknown>;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export class VectorStore {
  private docs = new Map<string, RagDoc>();
  private vectors = new Map<string, number[]>();
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  upsert(doc: RagDoc, vector: number[]): void {
    this.docs.set(doc.id, doc);
    this.vectors.set(doc.id, vector);
  }

  cosineSearch(queryVector: number[], topK: number, ns?: string): { doc: RagDoc; score: number }[] {
    const results: { doc: RagDoc; score: number }[] = [];
    for (const [id, v] of this.vectors) {
      const doc = this.docs.get(id);
      if (!doc) continue;
      if (v.length === 0 || v.length !== queryVector.length) continue; // 跳过未嵌入的空向量
      if (ns && doc.ns !== ns) continue;
      results.push({ doc, score: cosine(queryVector, v) });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  getAllDocs(): RagDoc[] {
    return [...this.docs.values()];
  }

  size(): number {
    return this.docs.size;
  }

  persist(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ docs: [...this.docs.values()], vectors: [...this.vectors.entries()] }),
        'utf8',
      );
    } catch {
      /* 忽略 */
    }
  }

  private load(): void {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      for (const d of parsed.docs ?? []) this.docs.set(d.id, d);
      for (const [id, v] of parsed.vectors ?? []) this.vectors.set(id, v);
    } catch {
      /* 无索引文件或损坏，从空开始 */
    }
  }
}
