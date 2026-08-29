import * as vscode from 'vscode';
import * as fs from 'fs';
import { E2W, W2E, StateSnapshot, ProgressState } from '../types';

const VIEW_ID = 'codeCoach.mainView';
const SECRET_KEY = 'codeCoach.apiKey';

/**
 * 侧栏 WebviewView 提供者。
 * 职责：渲染三段式 UI、建立消息通道、把命令路由到各业务模块（AI/评测/RAG/进度）。
 */
export class MainViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private messageDisposable?: vscode.Disposable;

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
      case 'openExerciseFile':
      case 'runTest':
      case 'submit':
      case 'askHelp':
      case 'nextExercise':
      case 'stopStream':
        // 教学闭环在 Step 5 接入；此处先占位，保证消息链路可验证
        this.post({ type: 'error', payload: { message: `「${msg.type}」将在后续步骤接入`, code: 'NOT_IMPLEMENTED' } });
        break;
      case 'getProgress':
        await this.sendState();
        break;
      default:
        this.post({ type: 'error', payload: { message: `未知命令`, code: 'UNKNOWN' } });
    }
  }

  private async sendState(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('codeCoach');
    const preset = cfg.get<string>('preset', 'deepseek');
    const model = cfg.get<string>('model', '') || preset;
    const baseURL = cfg.get<string>('baseURL', '') || '';
    const hasApiKey = !!(await this.context.secrets.get(SECRET_KEY));
    const progress: ProgressState = { completed: {}, streak: 0, totalCompleted: 0 };
    const snapshot: StateSnapshot = {
      progress,
      config: { hasApiKey, model, baseURL },
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
