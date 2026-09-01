// 题库校验 + 参考解回归测试（用真实 JDK 跑所有参考解）
import { test } from 'node:test';
import assert from 'node:assert';
import * as os from 'os';
import { EXERCISES } from '../src/bank/exercises';
import { validateExercises } from '../src/bank/loader';
import { evaluate } from '../src/judge/evaluator';

test('题库 schema 校验通过（无缺失/重复 id）', () => {
  assert.deepStrictEqual(validateExercises(EXERCISES), []);
});

test('题库为 15 题、覆盖 7 个主题', () => {
  assert.strictEqual(EXERCISES.length, 15);
  assert.strictEqual(new Set(EXERCISES.map((e) => e.topic)).size, 7);
});

test('所有参考解都能编译并通过全部测试用例', async () => {
  for (const ex of EXERCISES) {
    const result = await evaluate(ex, ex.solutionCode ?? '', {
      javaHome: process.env.JAVA_HOME || '',
      runDir: os.tmpdir(),
      compileTimeoutMs: 15000,
      runTimeoutMs: 3000,
    });
    assert.strictEqual(result.compile.ok, true, `${ex.id} 参考解编译失败: ${result.compile.errors.join(' | ')}`);
    assert.strictEqual(result.allPass, true, `${ex.id} 参考解未通过全部用例`);
  }
});
