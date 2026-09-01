/**
 * CodeCoach 共享类型定义。
 * 消息协议（webview ↔ 扩展）、题库 schema、评测结果、进度状态。
 * 前端侧对应字符串常量见 media/js/protocol.js。
 */

export interface AiConfig {
  baseURL: string;
  model: string;
  apiKey: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  input: string;          // 喂给 stdin 的原始文本
  expectedOutput: string; // 期望 stdout
  hint?: string;          // 该用例未通过时的定向提示
}

export interface Exercise {
  id: string;
  title: string;
  topic: string;          // 知识点主题：变量/数据类型/运算符/条件/循环/数组/方法
  difficulty: Difficulty;
  tags: string[];
  description: string;    // markdown 题面
  starterCode: string;    // 起始模板（含 main + TODO 注释）
  testCases: TestCase[];
  hints: string[];        // 分层提示，按需展开
  explanation: string;    // 参考讲解（供 AI 作 RAG 上下文，不直接展示）
  solutionCode?: string;  // 参考解（仅供 AI，绝不直接展示）
}

export type CaseStatus = 'pass' | 'fail' | 'runtimeError' | 'timeout' | 'oom';

export interface CaseResult {
  index: number;
  status: CaseStatus;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

export interface TestResult {
  compile: { ok: boolean; errors: string[] };
  cases: CaseResult[];
  passed: number;
  total: number;
  elapsedMs: number;
  allPass: boolean;
}

export interface CompletedRecord {
  passed: boolean;
  attempts: number;
  ts: number;
}

export interface ProgressState {
  completed: Record<string, CompletedRecord>;
  currentExerciseId?: string;
  streak: number;
  totalCompleted: number;
}

export interface ConfigSnapshot {
  hasApiKey: boolean;
  model: string;
  baseURL: string;
}

export interface StateSnapshot {
  progress: ProgressState;
  config: ConfigSnapshot;
  currentExerciseId?: string;
  totalExercises: number;
}

// ---- 消息协议：webview → 扩展（命令） ----
export type W2E =
  | { type: 'ready' }
  | { type: 'startLesson'; payload?: { exerciseId?: string } }
  | { type: 'openExerciseFile' }
  | { type: 'runTest' }
  | { type: 'submit' }
  | { type: 'askHelp'; payload: { question: string } }
  | { type: 'nextExercise' }
  | { type: 'getProgress' }
  | { type: 'openSettings' }
  | { type: 'stopStream' };

// ---- 消息协议：扩展 → webview（事件） ----
export type E2W =
  | { type: 'state'; payload: StateSnapshot }
  | { type: 'lessonContent'; payload: { topic: string; markdown: string; exercise?: Exercise } }
  | { type: 'aiStream'; payload: { id: string; delta: string } }
  | { type: 'aiStreamDone'; payload: { id: string; fullText: string } }
  | { type: 'testResult'; payload: TestResult }
  | { type: 'feedback'; payload: { markdown: string; summary: string } }
  | { type: 'progressUpdate'; payload: ProgressState }
  | { type: 'configChanged'; payload: ConfigSnapshot }
  | { type: 'error'; payload: { message: string; code?: string } };
