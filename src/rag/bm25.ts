// BM25 关键词检索（中文分词用 Intl.Segmenter，零依赖）
export function tokenize(text: string): string[] {
  const seg = new Intl.Segmenter('zh', { granularity: 'word' });
  const tokens: string[] = [];
  for (const s of seg.segment(String(text).toLowerCase())) {
    const w = s.segment.trim();
    if (w && !/^[\s\p{P}]+$/u.test(w)) tokens.push(w);
  }
  return tokens;
}

export interface Bm25Doc {
  id: string;
  text: string;
}

export interface Bm25Result {
  id: string;
  score: number;
}

export function bm25Search(query: string, docs: Bm25Doc[], topK: number): Bm25Result[] {
  const tokenized = docs.map((d) => ({ id: d.id, tokens: tokenize(d.text) }));
  const n = docs.length;
  if (n === 0) return [];

  const df = new Map<string, number>();
  for (const d of tokenized) {
    const seen = new Set(d.tokens);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const avgdl = tokenized.reduce((s, d) => s + d.tokens.length, 0) / n;
  const k1 = 1.5;
  const b = 0.75;
  const qTokens = tokenize(query);

  const results = tokenized.map((d) => {
    const tf = new Map<string, number>();
    for (const t of d.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of qTokens) {
      const dfT = df.get(t) ?? 0;
      const tfd = tf.get(t) ?? 0;
      if (tfd === 0) continue;
      const idf = Math.log(1 + (n - dfT + 0.5) / (dfT + 0.5));
      score += (idf * (tfd * (k1 + 1))) / (tfd + k1 * (1 - b + b * (d.tokens.length / avgdl)));
    }
    return { id: d.id, score };
  });
  return results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
}
