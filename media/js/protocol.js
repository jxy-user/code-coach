// 消息协议常量（与 src/types.ts 保持一致的字符串）
export const MSG = {
  // webview → 扩展
  READY: 'ready',
  START_LESSON: 'startLesson',
  OPEN_EXERCISE_FILE: 'openExerciseFile',
  RUN_TEST: 'runTest',
  SUBMIT: 'submit',
  ASK_HELP: 'askHelp',
  NEXT_EXERCISE: 'nextExercise',
  GET_PROGRESS: 'getProgress',
  OPEN_SETTINGS: 'openSettings',
  STOP_STREAM: 'stopStream',
  // 扩展 → webview
  STATE: 'state',
  LESSON_CONTENT: 'lessonContent',
  AI_STREAM: 'aiStream',
  AI_STREAM_DONE: 'aiStreamDone',
  TEST_RESULT: 'testResult',
  FEEDBACK: 'feedback',
  PROGRESS_UPDATE: 'progressUpdate',
  CONFIG_CHANGED: 'configChanged',
  ERROR: 'error',
};
