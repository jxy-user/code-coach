/** OpenAI 兼容 API 厂商预设（用户可完全自定义，不绑定任何厂商） */
export interface Preset {
  id: string;
  label: string;
  baseURL: string; // 根地址，不含 /chat/completions
  model: string;
}

export const PRESETS: Preset[] = [
  { id: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'kimi', label: 'Kimi (Moonshot)', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { id: 'moonshot', label: 'Moonshot', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
  { id: 'qwen', label: '通义千问', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'glm', label: '智谱 GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { id: 'ollama', label: 'Ollama (本地)', baseURL: 'http://localhost:11434/v1', model: 'qwen2.5:7b' },
  { id: 'custom', label: '自定义', baseURL: '', model: '' },
];

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
