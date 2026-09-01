// 检索入口：embedding 优先（cosine），未就绪/失败回退 BM25
import { isReady, embed, warmup } from './embedder';
import { bm25Search } from './bm25';
import { VectorStore, RagDoc } from './vectorStore';

export interface SearchResult {
  doc: RagDoc;
  score: number;
  method: 'vector' | 'bm25';
}

export class Retriever {
  constructor(private store: VectorStore) {}

  async warmup(cacheDir: string): Promise<void> {
    await warmup(cacheDir);
  }

  async query(query: string, topK = 5, ns?: string): Promise<SearchResult[]> {
    const filtered = ns ? this.store.getAllDocs().filter((d) => d.ns === ns) : this.store.getAllDocs();
    if (filtered.length === 0) return [];

    if (isReady()) {
      try {
        const qv = await embed(query);
        const results = this.store.cosineSearch(qv, topK, ns);
        return results.map((r) => ({ doc: r.doc, score: r.score, method: 'vector' as const }));
      } catch {
        /* 回退 BM25 */
      }
    }
    const byId = new Map(this.store.getAllDocs().map((d) => [d.id, d]));
    const results = bm25Search(query, filtered.map((d) => ({ id: d.id, text: d.text })), topK);
    return results.map((r) => ({ doc: byId.get(r.id)!, score: r.score, method: 'bm25' as const }));
  }
}
