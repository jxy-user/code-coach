import { AiConfig } from '../types';

/** 通用 OpenAI 兼容聊天客户端（不绑定厂商，依赖 baseURL/model/apiKey） */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  signal?: AbortSignal;
}

function endpoint(baseURL: string): string {
  return baseURL.replace(/\/+$/, '') + '/chat/completions';
}

function headers(config: AiConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };
}

/** 非流式对话 */
export async function chat(config: AiConfig, messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const res = await fetch(endpoint(config.baseURL), {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      stream: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API 请求失败 (${res.status}) ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

/** 流式对话（SSE），逐段 yield 内容增量 */
export async function* chatStream(
  config: AiConfig,
  messages: ChatMessage[],
  opts: ChatOptions = {},
): AsyncGenerator<string, void, void> {
  const res = await fetch(endpoint(config.baseURL), {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      stream: true,
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API 请求失败 (${res.status}) ${text.slice(0, 400)}`);
  }
  if (!res.body) throw new Error('响应无 body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      const delta = parseSseLine(line);
      if (delta) yield delta;
    }
  }
  // 处理结尾残留（最后一行可能无换行）
  if (buffer.trim()) {
    const delta = parseSseLine(buffer.trim());
    if (delta) yield delta;
  }
}

function parseSseLine(line: string): string | undefined {
  if (!line.startsWith('data:')) return undefined;
  const payload = line.slice(5).trim();
  if (payload === '[DONE]' || payload === '') return undefined;
  try {
    const json = JSON.parse(payload);
    const delta = json.choices?.[0]?.delta?.content;
    return typeof delta === 'string' ? delta : undefined;
  } catch {
    return undefined;
  }
}
