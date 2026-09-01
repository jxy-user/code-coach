import * as vscode from 'vscode';
import * as fs from 'fs';
import { E2W, W2E, StateSnapshot, ProgressState } from '../types';
import { getAiConfig, getConfigSnapshot } from '../config';
import { chatStream } from '../ai/client';
import { lessonPrompt } from '../ai/prompts';

/**
 * 侧栏 WebviewView 提供者。
 * 职责：渲染三段式 UI、建立消息通道、把命令路由到各业务模块（AI/评测/RAG/进度）。
 */
export class MainViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private messageDisposable?: vscode.Disposable;
  private activeAbort?: AbortController;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    // 先注销旧监听器，避免视图在侧栏/面板间拖动重建时重复注册
    this.messageDisposable?.dispose();
    this.messageDisposable = webviewView.webview.onDidReceiveMessage((msg: W2E) => {
      void this.handleMessage(msg);
    });
  }

  /** 向 webview 推送事件 */
  private post(msg: E2W): void {
    void this.view?.webview.postMessage(msg);
  }

  /** 组装 HTML：注入 CSP nonce 与资源 URI */
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
        await this.startLesson();
        break;
      case 'stopStream':
        this.activeAbort?.abort();
        break;
      case 'openExerciseFile':
      case 'runTest':
      case 'submit':
      case 'askHelp':
      case 'nextExercise':
        // 评测/点评/编辑器联动在后续步骤接入
        this.post({ type: 'error', payload: { message: `「${msg.type}」将在后续步骤接入`, code: 'NOT_IMPLEMENTED' } });
        break;
      case 'getProgress':
        await this.sendState();
        break;
      default:
        this.post({ type: 'error', payload: { message: '未知命令', code: 'UNKNOWN' } });
    }
  }

  /** AI 讲解知识点（流式）。Step 4/5 接入题库后改为当前练习主题。 */
  private async startLesson(): Promise<void> {
    const config = await getAiConfig(this.context);
    if (!config.apiKey) {
      this.post({
        type: 'error',
        payload: { message: '尚未配置 API Key。请执行命令「CodeCoach: 设置 API Key」或点「配置」。', code: 'NO_API_KEY' },
      });
      return;
    }
    const topic = 'Java 变量与数据类型';
    this.post({ type: 'lessonContent', payload: { topic, markdown: '' } });
    const { system, user } = lessonPrompt(topic);
    await this.streamAi('lesson', config, system, user);
  }

  /** 通用流式调用：把 AI 输出按增量推给 webview */
  private async streamAi(id: string, config: { baseURL: string; model: string; apiKey: string }, system: string, user: string): Promise<void> {
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

  private async sendState(): Promise<void> {
    const config = await getConfigSnapshot(this.context);
    const progress: ProgressState = { completed: {}, streak: 0, totalCompleted: 0 };
    const snapshot: StateSnapshot = {
      progress,
      config,
      totalExercises: 0,
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
