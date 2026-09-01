import { test } from 'node:test';
import assert from 'node:assert';
import { tokenize, bm25Search } from '../src/rag/bm25';

test('tokenize 中文分词产生非空 token', () => {
  const tokens = tokenize('Java 变量与数据类型');
  assert.ok(tokens.length > 0);
});

test('bm25 检索返回最相关文档', () => {
  const docs = [
    { id: 'a', text: 'Java 变量与数据类型 讲解' },
    { id: 'b', text: '数组求和与最大值' },
    { id: 'c', text: 'Java 循环 for while' },
  ];
  const results = bm25Search('变量', docs, 3);
  assert.ok(results.length > 0);
  assert.strictEqual(results[0].id, 'a');
});

test('bm25 对无关查询返回空', () => {
  const docs = [{ id: 'a', text: '变量与赋值' }];
  const results = bm25Search('完全不相关的内容xyz', docs, 3);
  assert.strictEqual(results.length, 0);
});
