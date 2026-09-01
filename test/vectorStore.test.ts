import { test } from 'node:test';
import assert from 'node:assert';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { VectorStore } from '../src/rag/vectorStore';
import { Retriever } from '../src/rag/retriever';

test('cosine 检索按相似度排序', () => {
  const store = new VectorStore(path.join(os.tmpdir(), `rag-cos-${Date.now()}.json`));
  store.upsert({ ns: 't', id: 'a', text: '变量' }, [1, 0, 0]);
  store.upsert({ ns: 't', id: 'b', text: '数组' }, [0, 1, 0]);
  store.upsert({ ns: 't', id: 'c', text: '变量相关' }, [0.9, 0.1, 0]);
  const results = store.cosineSearch([1, 0, 0], 2, 't');
  assert.strictEqual(results[0].doc.id, 'a');
  assert.ok(results[0].score > results[1].score);
});

test('持久化后可重新加载', () => {
  const file = path.join(os.tmpdir(), `rag-persist-${Date.now()}.json`);
  const store = new VectorStore(file);
  store.upsert({ ns: 't', id: 'x', text: 'hello' }, [1, 2, 3]);
  store.persist();
  const store2 = new VectorStore(file);
  assert.strictEqual(store2.size(), 1);
  fs.rmSync(file, { force: true });
});

test('retriever 在 embedder 未就绪时回退 BM25', async () => {
  const store = new VectorStore(path.join(os.tmpdir(), `rag-ret-${Date.now()}.json`));
  store.upsert({ ns: 'k', id: 'k1', text: 'Java 变量与数据类型讲解' }, []);
  store.upsert({ ns: 'k', id: 'k2', text: '数组求和与最大值' }, []);
  const retriever = new Retriever(store);
  const results = await retriever.query('变量', 2, 'k');
  assert.ok(results.length > 0);
  assert.strictEqual(results[0].method, 'bm25');
  assert.strictEqual(results[0].doc.id, 'k1');
});
