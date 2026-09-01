// 评测引擎集成测试：用真实 JDK 编译运行
import { test } from 'node:test';
import assert from 'node:assert';
import * as os from 'os';
import { evaluate } from '../src/judge/evaluator';
import { Exercise, TestCase } from '../src/types';

function makeExercise(testCases: TestCase[], extra: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test',
    title: 'test',
    topic: 'test',
    difficulty: 'easy',
    tags: [],
    description: '',
    starterCode: '',
    testCases,
    hints: [],
    explanation: '',
    ...extra,
  };
}

function opts(runTimeoutMs = 3000) {
  return {
    javaHome: process.env.JAVA_HOME || '',
    runDir: os.tmpdir(),
    compileTimeoutMs: 15000,
    runTimeoutMs,
  };
}

test('编译错误返回带行号的 errors', async () => {
  const source = 'public class Main {\n  public static void main(String[] args) {\n    int x = ;\n  }\n}\n';
  const result = await evaluate(makeExercise([]), source, opts());
  assert.strictEqual(result.compile.ok, false);
  assert.ok(result.compile.errors.length > 0);
  assert.ok(result.compile.errors.some((e) => e.includes('Main.java')));
});

test('正确代码全部通过（含中文输出，验证 UTF-8）', async () => {
  const source =
    'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String name = sc.nextLine();\n    System.out.println("你好，" + name);\n  }\n}\n';
  const ex = makeExercise([
    { input: '小明\n', expectedOutput: '你好，小明' },
    { input: '小红\n', expectedOutput: '你好，小红' },
  ]);
  const result = await evaluate(ex, source, opts());
  assert.strictEqual(result.compile.ok, true);
  assert.strictEqual(result.allPass, true);
  assert.strictEqual(result.passed, 2);
});

test('输出不匹配标记为 fail', async () => {
  const source = 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("wrong");\n  }\n}\n';
  const ex = makeExercise([{ input: '', expectedOutput: 'right' }]);
  const result = await evaluate(ex, source, opts());
  assert.strictEqual(result.compile.ok, true);
  assert.strictEqual(result.cases[0].status, 'fail');
});

test('数组越界标记为 runtimeError', async () => {
  const source = 'public class Main {\n  public static void main(String[] args) {\n    int[] a = new int[1];\n    System.out.println(a[5]);\n  }\n}\n';
  const ex = makeExercise([{ input: '', expectedOutput: 'x' }]);
  const result = await evaluate(ex, source, opts());
  assert.strictEqual(result.compile.ok, true);
  assert.strictEqual(result.cases[0].status, 'runtimeError');
});

test('死循环标记为 timeout', async () => {
  const source = 'public class Main {\n  public static void main(String[] args) {\n    while (true) {}\n  }\n}\n';
  const ex = makeExercise([{ input: '', expectedOutput: 'x' }]);
  const result = await evaluate(ex, source, opts(500));
  assert.strictEqual(result.compile.ok, true);
  assert.strictEqual(result.cases[0].status, 'timeout');
});
