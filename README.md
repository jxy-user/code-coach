# CodeCoach

AI 编程教练 VS Code 插件：在编辑器里**边学边练** Java 编程基础。

- AI 讲解知识点（流式）
- 出练习题，直接在编辑器写代码
- 保存自动轻量点评 + 手动求助
- 提交后**真实编译运行**自动判题 + AI 语义点评 + 自动总结
- 进度与错题记忆（本地 RAG 向量库）

## 特性

- 通用 OpenAI 兼容 API（DeepSeek / Kimi / Moonshot / 通义 / GLM / Ollama 等，不绑定厂商）
- 无视觉依赖，评测走「读代码文本 + 真实 JDK 编译运行」
- 本地 embedding（bge-small-zh）+ BM25 回退

## 开发

```bash
npm install
npm run build        # 构建
npm run test         # 单元/集成测试
npm run package      # 打包 vsix
```

按 F5 启动扩展开发宿主调试。

## 配置

在 VS Code 设置中配置 `codeCoach.*`，或命令面板执行 `CodeCoach: 设置 API Key`。

详见 `PROBLEMS.md` 记录开发中遇到的问题。
