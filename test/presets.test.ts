import { test } from 'node:test';
import assert from 'node:assert';
import { detectPreset } from '../src/ai/presets';

test('detectPreset 根据 baseURL 自动识别厂商', () => {
  assert.strictEqual(detectPreset('https://api.deepseek.com')?.id, 'deepseek');
  assert.strictEqual(detectPreset('https://api.moonshot.cn/v1')?.id, 'kimi');
  assert.strictEqual(detectPreset('https://dashscope.aliyuncs.com/compatible-mode/v1')?.id, 'qwen');
  assert.strictEqual(detectPreset('https://open.bigmodel.cn/api/paas/v4')?.id, 'glm');
  assert.strictEqual(detectPreset('http://localhost:11434/v1')?.id, 'ollama');
});

test('detectPreset 对未知 URL 或空值返回 undefined', () => {
  assert.strictEqual(detectPreset('https://my-custom-api.example.com'), undefined);
  assert.strictEqual(detectPreset(''), undefined);
});
