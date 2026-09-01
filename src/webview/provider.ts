import * as vscode from 'vscode';
import * as fs from 'fs';
import { E2W, W2E, StateSnapshot, Exercise, TestResult, AiConfig } from '../types';
import { getAiConfig, getConfigSnapshot, getJavaHome, getTimeouts } from '../config';
import { chatStream } from '../ai/client';
import { lessonPrompt, instantFeedbackPrompt, fullFeedbackPrompt, helpPrompt } from '../ai/prompts';
import { evaluate } from '../judge/evaluator';
import { loadExercises, getExercise, exerciseCount } from '../bank/loader';
import { ProgressStore } from '../progress/store';

/**
 * 侧栏 WebviewView 提供者：消息路由 + 教学闭环编排。
 */
export class MainViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private messageDisposable?: vscode.Disposable;
  private activeAbort?: AbortController;
  private currentExercise?: Exercise;
  private instantTimer?: NodeJS.Timeout;
  private progressStore: ProgressStore;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.progressStore = new ProgressStore(context);
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    this.messageDisposable?.dispose();
    this.messageDisposable = webviewView.webview.onDidReceiveMessage((msg: W2E) => {
      void this.handleMessage(msg);
    });
  }

  /** 保存 Java 文件时触发轻量点评（debounce，由 extension 的 onDidSaveTextDocument 调用） */
  onDidSaveDocument(doc: vscode.TextDocument): void {
    if (!this.currentExercise) return;
    if (!doc.fileName.endsWith('Main.java')) return;
    if (this.instantTimer) clearTimeout(this.instantTimer);
    this.instantTimer = setTimeout(() => void this.instantFeedback(doc.getText()), 1200);
  }

  private post(msg: E2W): void {
    void this.view?.webview.postMessage(msg);
  }

  private getHtml(webview: vscode.Webview): string {
    const mediaDir = vscode.Uri.joinPath(this.context.extensionUri, 'media');
    const nonce = getNonce();
    const htmlPath = vscode.Uri.joinPath(mediaDir, 'main.html').fsPath;
    let html = fs.readFileSync(htmlPath, 'utf8');
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaDir, 'style.css'));
    const appUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaDir, 'js', 'app.js'));
    return html
      .replaceAll('{{nonce}}', nonce)
      .replaceAll('{{cspSource}}', webview.cspSource)
      .replaceAll('{{styleUri}}', styleUri.toString())
      .replaceAll('{{appUri}}', appUri.toString());
  }

  private async handleMessage(msg: W2E): Promise<void> {
    switch (msg.type) {
      case 'ready':
        await this.sendState();
        break;
      case 'openSettings':
        await vscode.commands.executeCommand('workbench.action.openSettings', 'codeCoach');
        break;
      case 'startLesson':
        await this.startLesson(msg.payload?.exerciseId);
        break;
      case 'openExerciseFile':
        await this.openExerciseFile();
        break;
      case 'runTest':
        await this.runTest();
        break;
      case 'submit':
        await this.submit();
        break;
      case 'askHelp':
        await this.askHelp(msg.payload.question);
        break;
      case 'nextExercise':
        await this.nextExercise();
        break;
      case 'stopStream':
        this.activeAbort?.abort();
        break;
      case 'getProgress':
        await this.sendState();
        break;
      default:
        this.post({ type: 'error', payload: { message: '未知命令', code: 'UNKNOWN' } });
    }
  }

  // ---------- 教学闭环 ----------

  private async startLesson(exerciseId?: string): Promise<void> {
    const config = await getAiConfig(this.context);
    if (!config.apiKey) {
      this.post({ type: 'error', payload: { message: '尚未配置 API Key。请执行命令「CodeCoach: 设置 API Key」或点「配置」。', code: 'NO_API_KEY' } });
      return;
    }
    const exercise = exerciseId ? getExercise(exerciseId) : this.nextTodoExercise();
    if (!exercise) {
      this.post({ type: 'error', payload: { message: '题库为空', code: 'NO_EXERCISE' } });
      return;
    }
    this.currentExercise = exercise;
    this.progressStore.setCurrentExercise(exercise.id);
    this.post({ type: 'lessonContent', payload: { topic: exercise.topic, markdown: '', exercise } });
    const { system, user } = lessonPrompt(`${exercise.topic}——${exercise.title}`);
    await this.streamAi('lesson', config, system, user);
  }

  private nextTodoExercise(): Exercise | undefined {
    const progress = this.progressStore.get();
    return loadExercises().find((e) => !progress.completed[e.id]?.passed) ?? loadExercises()[0];
  }

  private async nextExercise(): Promise<void> {
    const exercises = loadExercises();
    const idx = this.currentExercise ? exercises.findIndex((e) => e.id === this.currentExercise!.id) : -1;
    const next = exercises[idx + 1] ?? exercises[0];
    await this.startLesson(next.id);
  }

  private getActiveSource(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;
    if (!editor.document.fileName.endsWith('.java')) return undefined;
    return editor.document.getText();
  }

  private evalOpts() {
    const t = getTimeouts();
    return {
      javaHome: getJavaHome(),
      runDir: this.context.globalStorageUri.fsPath,
      compileTimeoutMs: t.compileTimeoutMs,
      runTimeoutMs: t.runTimeoutMs,
    };
  }

  private async runTest(): Promise<void> {
    const ex = this.currentExercise;
    if (!ex) {
      this.post({ type: 'error', payload: { message: '请先点「开始学习」选择一道题', code: 'NO_EXERCISE' } });
      return;
    }
    const source = this.getActiveSource();
    if (source === undefined) {
      this.post({ type: 'error', payload: { message: '请打开 Main.java（点「打开练习文件」）', code: 'NO_SOURCE' } });
      return;
    }
    const result = await evaluate(ex, source, this.evalOpts());
    this.post({ type: 'testResult', payload: result });
  }

  private async submit(): Promise<void> {
    const ex = this.currentExercise;
    if (!ex) {
      this.post({ type: 'error', payload: { message: '请先点「开始学习」选择一道题', code: 'NO_EXERCISE' } });
      return;
    }
    const source = this.getActiveSource();
    if (source === undefined) {
      this.post({ type: 'error', payload: { message: '请打开 Main.java（点「打开练习文件」）', code: 'NO_SOURCE' } });
      return;
    }
    const result = await evaluate(ex, source, this.evalOpts());
    this.post({ type: 'testResult', payload: result });

    this.progressStore.record(ex.id, result.allPass);
    this.post({ type: 'progressUpdate', payload: this.progressStore.get() });

    const config = await getAiConfig(this.context);
    if (!config.apiKey) return;
    const { system, user } = fullFeedbackPrompt(ex.title, source, this.summarizeTestResult(result));
    await this.streamAi('feedback', config, system, user);
  }

  private async askHelp(question: string): Promise<void> {
    const config = await getAiConfig(this.context);
    if (!config.apiKey) {
      this.post({ type: 'error', payload: { message: '尚未配置 API Key', code: 'NO_API_KEY' } });
      return;
    }
    const source = this.getActiveSource() ?? '';
    const { system, user } = helpPrompt(this.currentExercise?.title ?? '当前练习', source, question);
    await this.streamAi('help', config, system, user);
  }

  private async instantFeedback(source: string): Promise<void> {
    if (this.activeAbort) return; // 已有流在跑，跳过轻量点评避免打断
    const config = await getAiConfig(this.context);
    if (!config.apiKey) return;
    const { system, user } = instantFeedbackPrompt(this.currentExercise?.title ?? '', source);
    await this.streamAi('instant', config, system, user);
  }

  private async openExerciseFile(): Promise<void> {
    const ex = this.currentExercise;
    if (!ex) {
      this.post({ type: 'error', payload: { message: '请先点「开始学习」选择一道题', code: 'NO_EXERCISE' } });
      return;
    }
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.post({ type: 'error', payload: { message: '请先打开一个文件夹作为工作区', code: 'NO_FOLDER' } });
      return;
    }
    const uri = vscode.Uri.joinPath(folder.uri, 'Main.java');
    try {
      await vscode.workspace.fs.stat(uri);
    } catch {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(ex.starterCode, 'utf8'));
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    const text = doc.getText();
    const idx = text.indexOf('TODO');
    if (idx >= 0) {
      const line = doc.lineAt(doc.positionAt(idx).line);
      editor.selection = new vscode.Selection(line.range.start, line.range.end);
      editor.revealRange(line.range, vscode.TextEditorRevealType.InCenter);
    }
  }

  // ---------- 通用流式 + 状态 ----------

  private async streamAi(id: string, config: AiConfig, system: string, user: string): Promise<void> {
    this.activeAbort?.abort();
    const abort = new AbortController();
    this.activeAbort = abort;
    try {
      let full = '';
      for await (const delta of chatStream(
        config,
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { signal: abort.signal },
      )) {
        full += delta;
        this.post({ type: 'aiStream', payload: { id, delta } });
      }
      this.post({ type: 'aiStreamDone', payload: { id, fullText: full } });
    } catch (err) {
      if (abort.signal.aborted) {
        this.post({ type: 'aiStreamDone', payload: { id, fullText: '' } });
      } else {
        this.post({ type: 'error', payload: { message: err instanceof Error ? err.message : String(err), code: 'AI_ERROR' } });
      }
    } finally {
      if (this.activeAbort === abort) this.activeAbort = undefined;
    }
  }

  private summarizeTestResult(r: TestResult): string {
    if (!r.compile.ok) return `编译失败：${r.compile.errors.join('; ')}`;
    const parts = r.cases.map((c) => {
      const label = { pass: '通过', fail: '失败', runtimeError: '异常', timeout: '超时', oom: '内存溢出' }[c.status];
      return `#${c.index + 1} ${label}${c.error ? '（' + c.error + '）' : ''}`;
    });
    return `通过 ${r.passed}/${r.total}。${parts.join('；')}`;
  }

  private async sendState(): Promise<void> {
    const config = await getConfigSnapshot(this.context);
    const progress = this.progressStore.get();
    const snapshot: StateSnapshot = {
      progress,
      config,
      currentExerciseId: this.currentExercise?.id ?? progress.currentExerciseId,
      totalExercises: exerciseCount(),
    };
    this.post({ type: 'state', payload: snapshot });
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
