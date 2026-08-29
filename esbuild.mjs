// CodeCoach 打包脚本：build / watch / test 三种模式
// 用法：node esbuild.mjs [--watch] [--test]
import { build, context } from 'esbuild';
import { rmSync } from 'fs';

const isWatch = process.argv.includes('--watch');
const isTest = process.argv.includes('--test');

// 共享配置：node 目标、CJS 输出（VS Code 扩展宿主用 CommonJS）
const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  logLevel: 'info',
  // vscode 由宿主提供；transformers/onnxruntime 为 ESM/native，保持 external 供运行时动态 import
  external: ['vscode', '@xenova/transformers', 'onnxruntime-node'],
};

if (isTest) {
  rmSync('dist-test', { recursive: true, force: true });
  await build({
    ...shared,
    entryPoints: ['test/*.test.ts'],
    outdir: 'dist-test',
    external: ['vscode', '@xenova/transformers', 'onnxruntime-node'],
  });
  console.log('✅ 测试打包完成 → dist-test/');
} else if (isWatch) {
  const ctx = await context({
    ...shared,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
  });
  await ctx.watch();
  console.log('👀 watch 模式已启动（src → dist/extension.js）');
} else {
  await build({
    ...shared,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
  });
  console.log('✅ 构建完成 → dist/extension.js');
}
