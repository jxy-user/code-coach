# CodeCoach

AI 编程教练 VS Code 插件：在编辑器里**边学边练** Java 编程基础，像真人老师一样「讲解 → 出题 → 写代码 → 自动评测 → 点评 → 记住进度」。

---

## 📥 下载与安装

**直接下载安装包（vsix）**：

> [⬇️ 下载 code-coach-0.1.0.vsix](https://github.com/jxy-user/code-coach/releases/download/v0.1.0/code-coach-0.1.0.vsix)

- 历史版本与说明：**[Releases 页面](https://github.com/jxy-user/code-coach/releases)**
- 源码整套下载：仓库首页绿色 **Code** 按钮 → **Download ZIP**

**安装**（任选其一）：

```bash
# 命令行
code --install-extension code-coach-0.1.0.vsix
```

或：VS Code → 扩展面板 → 右上角 `⋯` → **Install from VSIX...** → 选择下载的 `.vsix` 文件。

---

## ⚙️ 配置 API Key

插件使用**通用 OpenAI 兼容 API**，不绑定厂商（DeepSeek / Kimi / Moonshot / 通义 / GLM / Ollama 等）。

1. 命令面板（`Ctrl+Shift+P`）→ 执行 **`CodeCoach: 设置 API Key`**，粘贴你的 key（保存到系统安全存储，不写入任何文件）
2. 默认使用 DeepSeek 官方；如需切换厂商，在 VS Code 设置里改 `codeCoach.preset`（或手动填 `codeCoach.baseURL` / `codeCoach.model`）

> 前置要求：本机已装 **JDK**（评测用真实 `javac`/`java` 编译运行）。未装会提示，可在设置 `codeCoach.javaHome` 指定 JDK 路径。

---

## 🚀 使用

1. 点左侧活动栏 **CodeCoach** 图标，打开侧栏
2. 点 **开始学习** → AI 流式讲解知识点 → 显示练习题
3. 点 **打开练习文件** → 在编辑器写 `Main.java`
4. 保存时 AI 自动轻量提示；也可在底部输入框**求助**
5. 点 **运行测试** 客观判题；点 **提交** 判题 + AI 完整点评 + 记录进度
6. 点 **下一题** 继续

---

## ✨ 功能特性

- **混合式教学**：讲解 → 出题 → 保存即时提示 → 提交后完整点评 + 总结
- **无视觉依赖**：评测走「读代码文本 + 真实 JDK 编译运行」，不识别图片
- **OJ 风格评测**：写 `Main.java`，多组测试用例比对，编译错误含行号
- **内置 15 题**：变量 / 数据类型 / 运算符 / 条件 / 循环 / 数组 / 方法
- **本地 RAG 向量库**：中文 embedding（bge-small-zh）+ BM25 回退，记住进度与错题
- **AI 语义点评**：客观判题由评测引擎完成，AI 只做讲解与改进建议（防幻觉）

---

## 🛠 开发

```bash
npm install
npm run build        # 构建
npm run test         # 单元/集成测试（17 个）
npm run package      # 打包 vsix
```

按 `F5` 启动扩展开发宿主调试。

开发中遇到的问题记录在 [`PROBLEMS.md`](./PROBLEMS.md)。

## 许可

[MIT](./LICENSE)
