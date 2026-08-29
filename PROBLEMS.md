# CodeCoach — 问题记录

全程记录开发中遇到的每个问题：**现象 / 根因 / 解决方案 / 待办方向**，后续同类问题直接复用解决方向。

## 已知高优先级待验证点

| # | 现象/风险 | 根因 | 解决方案 | 状态 |
|---|---|---|---|---|
| P1 | `@xenova/transformers` 在 VS Code 扩展 host（Electron/Node）能否加载 onnxruntime-node | Electron 与 Node 的 ABI 差异（N-API 应稳定） | 懒加载 + 动态 import；不行则 BM25 兜底为主 | 待验证 |
| P2 | Windows 下 Java 中文 stdout/stdin 乱码 | 默认编码非 UTF-8 | `javac -encoding UTF-8` + `java -Dfile.encoding=UTF-8`，stdin/stdout 显式 UTF-8 | 已预留 |
| P3 | vsce 打包 native `.node`（onnxruntime-node）与平台二进制 | 跨平台二进制 | `.vscodeignore` 精确控制；单用户 Windows MVP 可接受 | 待处理 |

## 实际遇到的问题

（开发过程中逐条追加）
