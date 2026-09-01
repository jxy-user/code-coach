// 编译运行 Java 代码：javac 编译 + java 运行，含超时/杀进程树/UTF-8 编码处理
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface CompileResult {
  ok: boolean;
  errors: string[];
}

export interface RunResult {
  status: 'ok' | 'runtimeError' | 'timeout' | 'oom';
  stdout: string;
  stderr: string;
}

/** 解析可执行文件路径：优先 javaHome/bin，回退裸命令（依赖 PATH） */
function resolveJavaBin(name: string, javaHome: string): string {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  if (javaHome) {
    const p = path.join(javaHome, 'bin', exe);
    if (fs.existsSync(p)) return p;
  }
  return name;
}

/** 杀进程树：Windows 用 taskkill，其他平台 SIGKILL */
function killTree(child: ChildProcess): void {
  try {
    if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/F', '/T', '/PID', String(child.pid)]);
    } else {
      child.kill('SIGKILL');
    }
  } catch {
    /* 忽略 */
  }
}

/** 编译 Main.java，返回编译结果（errors 含行号） */
export function compile(javaHome: string, workDir: string, sourceFile: string, timeoutMs: number): Promise<CompileResult> {
  return new Promise((resolve) => {
    const javac = resolveJavaBin('javac', javaHome);
    const outDir = path.join(workDir, 'out');
    fs.mkdirSync(outDir, { recursive: true });
    const child = spawn(javac, ['-encoding', 'UTF-8', '-d', outDir, sourceFile], { cwd: workDir });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (r: CompileResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    const timer = setTimeout(() => {
      killTree(child);
      finish({ ok: false, errors: ['编译超时'] });
    }, timeoutMs);
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')));
    child.on('error', (err) => {
      clearTimeout(timer);
      finish({ ok: false, errors: [`无法启动 javac：${err.message}`] });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) finish({ ok: true, errors: [] });
      else finish({ ok: false, errors: (stderr || stdout).split('\n').filter(Boolean) });
    });
  });
}

/** 运行编译产物 Main，喂 stdin，收集 stdout/stderr，超时/异常分类 */
export function run(javaHome: string, workDir: string, input: string, timeoutMs: number): Promise<RunResult> {
  return new Promise((resolve) => {
    const java = resolveJavaBin('java', javaHome);
    const outDir = path.join(workDir, 'out');
    // JDK 18+ (JEP 400)：System.out/in 的编码由独立的 stdin/stdout/stderr.encoding 决定（Windows 默认 GBK），
    // 必须显式设为 UTF-8，否则中文 stdin/stdout 乱码
    const child = spawn(
      java,
      ['-cp', outDir, '-Dfile.encoding=UTF-8', '-Dstdin.encoding=UTF-8', '-Dstdout.encoding=UTF-8', '-Dstderr.encoding=UTF-8', '-Xmx256m', 'Main'],
      { cwd: workDir, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (status: RunResult['status']) => {
      if (settled) return;
      settled = true;
      resolve({ status, stdout, stderr });
    };
    const timer = setTimeout(() => {
      killTree(child);
      finish('timeout');
    }, timeoutMs);
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')));
    child.on('error', () => {
      clearTimeout(timer);
      finish('runtimeError');
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      if (code === 0) finish('ok');
      else if (stderr.includes('OutOfMemoryError')) finish('oom');
      else finish('runtimeError');
    });
    child.stdin.write(input, 'utf8');
    child.stdin.end();
  });
}
