// OJ 评测引擎：编译 + 多组测试用例运行 + 输出归一化比对
import * as fs from 'fs';
import * as path from 'path';
import { Exercise, TestResult, CaseResult } from '../types';
import { compile, run } from './compiler';

export interface EvaluateOptions {
  javaHome: string;
  runDir: string; // 临时目录根
  compileTimeoutMs: number;
  runTimeoutMs: number;
}

/** 输出归一化：\r\n→\n、逐行去尾空白、去首尾空行 */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

export async function evaluate(exercise: Exercise, source: string, opts: EvaluateOptions): Promise<TestResult> {
  const start = Date.now();
  const workDir = path.join(opts.runDir, `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, 'Main.java'), source, 'utf8');

  try {
    const compileResult = await compile(opts.javaHome, workDir, 'Main.java', opts.compileTimeoutMs);
    if (!compileResult.ok) {
      return {
        compile: { ok: false, errors: compileResult.errors },
        cases: [],
        passed: 0,
        total: exercise.testCases.length,
        elapsedMs: Date.now() - start,
        allPass: false,
      };
    }

    const cases: CaseResult[] = [];
    let passed = 0;
    for (let i = 0; i < exercise.testCases.length; i++) {
      const tc = exercise.testCases[i];
      const rr = await run(opts.javaHome, workDir, tc.input, opts.runTimeoutMs);
      const expected = normalizeOutput(tc.expectedOutput);
      let status: CaseResult['status'];
      let actual = '';
      let error: string | undefined;
      if (rr.status === 'ok') {
        actual = rr.stdout;
        status = normalizeOutput(rr.stdout) === expected ? 'pass' : 'fail';
      } else if (rr.status === 'timeout') {
        status = 'timeout';
        error = '运行超时';
      } else if (rr.status === 'oom') {
        status = 'oom';
        error = '内存溢出';
      } else {
        status = 'runtimeError';
        error = rr.stderr.split('\n').filter(Boolean)[0]?.slice(0, 200) ?? '运行时异常';
      }
      if (status === 'pass') passed++;
      cases.push({
        index: i,
        status,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: actual || error || '',
        error,
      });
    }

    return {
      compile: { ok: true, errors: [] },
      cases,
      passed,
      total: exercise.testCases.length,
      elapsedMs: Date.now() - start,
      allPass: passed === exercise.testCases.length,
    };
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* 忽略清理失败 */
    }
  }
}
