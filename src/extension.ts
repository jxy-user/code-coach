import * as vscode from 'vscode';
import { MainViewProvider } from './webview/provider';

/**
 * CodeCoach 扩展入口。
 * 职责：注册侧栏 WebviewView、命令、SecretStorage，并装配各业务模块。
 */
export function activate(context: vscode.ExtensionContext): void {
  const provider = new MainViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codeCoach.mainView', provider),
    vscode.commands.registerCommand('codeCoach.openSettings', () => {
      void vscode.commands.executeCommand('workbench.action.openSettings', 'codeCoach');
    }),
    vscode.commands.registerCommand('codeCoach.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: '输入 OpenAI 兼容 API Key（保存到 SecretStorage，不会写入配置文件）',
        password: true,
        ignoreFocusOut: true,
      });
      if (key) {
        await context.secrets.store('codeCoach.apiKey', key.trim());
        void vscode.window.showInformationMessage('CodeCoach：API Key 已安全保存');
      }
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => provider.onDidSaveDocument(doc)),
  );
}

export function deactivate(): void {
  // 预留：清理运行中的子进程 / 中断 AI 流
}
