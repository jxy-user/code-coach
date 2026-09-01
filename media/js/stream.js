// 流式渲染：按 id 累积文本并实时重渲染 markdown
import { renderMarkdown, ensureStreamContainer } from './renderer.js';

const streams = new Map();

export function appendDelta(id, delta) {
  const s = streams.get(id) || { text: '' };
  s.text += delta;
  streams.set(id, s);
  const el = ensureStreamContainer(id);
  if (el) el.innerHTML = renderMarkdown(s.text);
  // 流式增长时自动滚动到底部，保证用户看到最新输出
  const content = document.getElementById('content');
  if (content) content.scrollTop = content.scrollHeight;
}

export function endStream(id) {
  streams.delete(id);
}
