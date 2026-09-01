// client.ts 的 SSE 流式解析测试（用本地 mock server，不依赖真实 key/网络）
import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { chat, chatStream } from '../src/ai/client';

function startServer(handler: http.RequestListener): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('chatStream 正确解析 SSE 流并拼接增量', async () => {
  const chunks = ['你', '好，', '欢迎', '学 Java'];
  const server = await startServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    for (const c of chunks) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  });
  const port = (server.address() as AddressInfo).port;
  const config = { baseURL: `http://127.0.0.1:${port}`, model: 'test', apiKey: 'x' };
  let full = '';
  for await (const delta of chatStream(config, [{ role: 'user', content: 'hi' }])) {
    full += delta;
  }
  assert.strictEqual(full, '你好，欢迎学 Java');
  server.close();
});

test('chat 非流式返回完整内容', async () => {
  const server = await startServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: 'hello world' } }] }));
  });
  const port = (server.address() as AddressInfo).port;
  const config = { baseURL: `http://127.0.0.1:${port}`, model: 'test', apiKey: 'x' };
  const text = await chat(config, [{ role: 'user', content: 'hi' }]);
  assert.strictEqual(text, 'hello world');
  server.close();
});

test('chatStream 遇到非 2xx 抛出带状态码的错误', async () => {
  const server = await startServer((req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'invalid api key' } }));
  });
  const port = (server.address() as AddressInfo).port;
  const config = { baseURL: `http://127.0.0.1:${port}`, model: 'test', apiKey: 'bad' };
  await assert.rejects(async () => {
    for await (const _ of chatStream(config, [{ role: 'user', content: 'hi' }])) {
      /* noop */
    }
  }, /401/);
  server.close();
});
