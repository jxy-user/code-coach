// CodeCoach webview 主控：消息路由 + 事件委托
import { MSG } from './protocol.js';
import * as R from './renderer.js';
import * as stream from './stream.js';

const vscode = acquireVsCodeApi();
let lastTestResult = null;

function post(type, payload) {
  vscode.postMessage(payload === undefined ? { type } : { type, payload });
}

function handle(msg) {
  switch (msg.type) {
    case MSG.STATE:
      R.renderProgress(msg.payload.progress, msg.payload.totalExercises);
      R.renderConfigHint(msg.payload.config);
      break;
    case MSG.LESSON_CONTENT: {
      const { topic, exercise } = msg.payload;
      R.hideOnboarding();
      R.renderLesson(topic);
      if (exercise) {
        R.renderExercise(exercise);
        R.renderHints(exercise.hints);
      }
      R.showFooter();
      break;
    }
    case MSG.AI_STREAM:
      stream.appendDelta(msg.payload.id, msg.payload.delta);
      break;
    case MSG.AI_STREAM_DONE:
      stream.endStream(msg.payload.id);
      break;
    case MSG.TEST_RESULT:
      lastTestResult = msg.payload;
      R.renderTestResult(msg.payload);
      break;
    case MSG.FEEDBACK:
      R.renderFeedback(msg.payload.markdown);
      break;
    case MSG.PROGRESS_UPDATE:
      R.renderProgress(msg.payload, msg.payload ? (msg.payload.totalExercises ?? 0) : 0);
      break;
    case MSG.CONFIG_CHANGED:
      R.renderConfigHint(msg.payload);
      break;
    case MSG.ERROR:
      R.renderError(msg.payload.message);
      break;
  }
}

window.addEventListener('message', (e) => handle(e.data));

document.addEventListener('click', (e) => {
  const cmdEl = e.target.closest('[data-cmd]');
  if (cmdEl) {
    const cmd = cmdEl.dataset.cmd;
    if (cmd === 'startLesson') post(MSG.START_LESSON);
    else if (cmd === 'openSettings') post(MSG.OPEN_SETTINGS);
    else if (cmd === 'runTest') post(MSG.RUN_TEST);
    else if (cmd === 'submit') post(MSG.SUBMIT);
    else if (cmd === 'nextExercise') post(MSG.NEXT_EXERCISE);
    else if (cmd === 'openExerciseFile') post(MSG.OPEN_EXERCISE_FILE);
    else if (cmd === 'askHelp') {
      const input = document.getElementById('help-input');
      const q = input.value.trim();
      if (q) { post(MSG.ASK_HELP, { question: q }); input.value = ''; }
    }
    return;
  }
  const hintEl = e.target.closest('[data-hint]');
  if (hintEl) {
    const body = document.getElementById('hint-body-' + hintEl.dataset.hint);
    if (body) body.classList.toggle('open');
    return;
  }
  const caseEl = e.target.closest('[data-case]');
  if (caseEl) {
    R.renderCaseDetail(lastTestResult, parseInt(caseEl.dataset.case, 10));
  }
});

// 初始握手
post(MSG.READY);
