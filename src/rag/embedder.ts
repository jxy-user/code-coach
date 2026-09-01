// 本地 embedding（bge-small-zh-v1.5，512 维），懒加载 + BM25 回退的 ready 标志
let extractorPromise: Promise<any> | null = null;
let ready = false;

export function isReady(): boolean {
  return ready;
}

/** 后台预热（不阻塞扩展激活），失败则保持未 ready（走 BM25 回退） */
export async function warmup(cacheDir: string): Promise<void> {
  if (extractorPromise) return;
  extractorPromise = (async () => {
    const mod = await import('@xenova/transformers');
    mod.env.cacheDir = cacheDir;
    mod.env.remoteHost = 'https://hf-mirror.com'; // 国内镜像
    mod.env.allowRemoteModels = true;
    const extractor = await mod.pipeline('feature-extraction', 'Xenova/bge-small-zh-v1.5', { dtype: 'q8' } as any);
    ready = true;
    return extractor;
  })();
  try {
    await extractorPromise;
  } catch {
    ready = false;
  }
}

export async function embed(text: string): Promise<number[]> {
  const extractor = await extractorPromise;
  const out = await extractor(text);
  return meanPoolNormalize(out);
}

function meanPoolNormalize(out: any): number[] {
  const dims = out.dims as number[];
  if (dims.length <= 2) return Array.from(out.data);
  const hidden = dims[dims.length - 1];
  const seqLen = dims[dims.length - 2];
  const data = out.data as Float32Array;
  const vec = new Array(hidden).fill(0);
  for (let t = 0; t < seqLen; t++) {
    for (let h = 0; h < hidden; h++) vec[h] += data[t * hidden + h];
  }
  for (let h = 0; h < hidden; h++) vec[h] /= seqLen;
  let norm = 0;
  for (let h = 0; h < hidden; h++) norm += vec[h] * vec[h];
  norm = Math.sqrt(norm) || 1;
  for (let h = 0; h < hidden; h++) vec[h] /= norm;
  return vec;
}
