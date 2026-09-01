import * as vscode from 'vscode';
import { AiConfig } from './types';
import { getPreset } from './ai/presets';

const SECRET_KEY = 'codeCoach.apiKey';

/** 组合 settings + secrets，得到最终 AI 配置（不绑定厂商，完全由用户配置） */
export async function getAiConfig(context: vscode.ExtensionContext): Promise<AiConfig> {
  const cfg = vscode.workspace.getConfiguration('codeCoach');
  const presetId = cfg.get<string>('preset', 'deepseek');
  const preset = getPreset(presetId);
  const baseURL = cfg.get<string>('baseURL', '') || preset.baseURL;
  const model = cfg.get<string>('model', '') || preset.model;
  const apiKey = (await context.secrets.get(SECRET_KEY)) ?? '';
  return { baseURL, model, apiKey };
}

/** 供 UI 展示的配置摘要（不含 apiKey） */
export async function getConfigSnapshot(context: vscode.ExtensionContext) {
  const config = await getAiConfig(context);
  return { hasApiKey: !!config.apiKey, model: config.model, baseURL: config.baseURL };
}

export function getJavaHome(): string {
  const cfg = vscode.workspace.getConfiguration('codeCoach');
  return cfg.get<string>('javaHome', '') || process.env.JAVA_HOME || '';
}

export function getTimeouts() {
  const cfg = vscode.workspace.getConfiguration('codeCoach');
  return {
    compileTimeoutMs: cfg.get<number>('compileTimeoutMs', 15000),
    runTimeoutMs: cfg.get<number>('runTimeoutMs', 3000),
  };
}
