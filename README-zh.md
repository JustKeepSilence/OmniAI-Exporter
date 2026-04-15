# 🚀 OmniAI Exporter

# 🚀 OmniAI Exporter

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

OmniAI Exporter 是一款极其强悍的浏览器插件，致力于为开发者、研究人员和 AI 重度用户提供**最纯净、最高清**的 AI 对话导出体验。

## 🛡️ 绝对的隐私安全 (Privacy & Security First)

**我们深知 AI 对话中包含您极其重要的商业机密与个人隐私。**
因此，OmniAI Exporter 坚持**「100% 纯浏览器本地运行」**的核心架构：
* 🚫 **零后端依赖**：插件不包含任何连接到我们服务器的 API 调用。
* 🚫 **零数据上报**：您的所有对话数据、代码片段、提取记录均在您的本地浏览器内存中即用即毁。
* ✅ **绝对安全**：我们无法、也没有任何途径获取您的任何数据，请安心将它用于最高机密级别的企业开发环境中。

## ✨ 核心特性 (Key Features)

* 🧹 **物理级 DOM 净化**：精准切除各大 AI 平台的广告、视频推流、复制按钮和隐藏数据（如 `script` / `style` 标签），只保留最纯粹的知识。
* 💻 **原生代码块拯救计划**：
  * 完美保留代码的原始换行符（防挤压变形）。
  * 跨节点窃取并重建语言标识（支持 C#, Python, Bash 等），完美对接下游语法高亮渲染。
  * 彻底消灭代码行号污染和多余的渲染 `<span>`。
* 📊 **表格降维防碎裂**：针对大厂复杂的表格嵌套（如 `<th><div>`），采用降维提纯算法，确保导出的 Markdown 表格规整不碎裂。
* 🎯 **无缝多平台适配**：基于虚拟列表 (Virtual List) 和定制化雷达扫描技术，精准区分 User 与 AI 的对话顺序，绝不串台。
* 🏷️ **智能标题提取**：自动读取对话上下文或 `document.title`，为你生成极具辨识度的导出文件名，告别凌乱的时间戳。

## 📥 导出格式与技术路线 (Export Formats & Roadmap)

我们致力于提供全场景的导出方案。以下是目前支持的格式与未来的技术路线图：

| 导出格式 | 核心技术方案 | 显著优势 | 局限性 / 缺点 | 支持状态 |
| :--- | :--- | :--- | :--- | :---: |
| **PDF (原生)** | `window.print()` 调用系统打印 | 🚀 **排版极度完美**，文字矢量高清，渲染速度极快，体积小 | 需要用户点击一下“保存”按钮进行手动确认 | ✅ 已支持 |
| **Markdown** | `Turndown.js` + 物理提纯算法 | 纯净无杂质，极其适合导入 Notion/Obsidian 进行二次编辑 | 暂无明显缺点 | ✅ 已支持 |
| **Plain Text** | `textContent` 原生提取 | 极其轻量，兼容所有记事本工具 | 丢失所有图片、加粗、表格等富文本排版 | ✅ 已支持 |
| **JSON** | 结构化序列化引擎 | 包含角色(Role)与原始结构，完美契合开发者进行数据分析与模型微调 | 不适合普通非技术用户直接阅读 | ✅ 已支持 |
| *PDF (静默)* | `html2pdf.js` / `jsPDF` | 一键静默后台下载，全自动闭环 | 生成速度受限于 DOM 规模，超长对话极易出现分页截断问题 | 🚧 计划中 |
| *长截图 (Image)* | `html2canvas` 离线绘制 | 所见即所得，像素级还原，最适合社交媒体分享 | 极度吃内存，超长对话易导致 Canvas 崩溃画出黑屏 | 🚧 计划中 |
| *Word (Docx)* | `html-docx-js` 协议转换 | 满足传统办公环境、OA 系统的强需求 | 前端复杂 CSS 样式转换到 Word XML 难度极大，易变形 | 🚧 计划中 |

## 📦 支持平台 (Supported Platforms)

目前已完美适配全网最强的几大主流大模型 Web 端：

* [x] **ChatGPT** & **OpenAI**
* [x] **DeepSeek** (深度求索)
* [x] **腾讯元宝** (Tencent Yuanbao)
* [x] **通义千问** (Alibaba Qianwen)
* [x] **豆包** (Doubao)
* [x] **Gemini**

## 🛠️ 安装说明 (Installation)

由于目前处于 1.0 开发者版本，请通过“加载已解压的扩展程序”进行安装：

1. 克隆本项目到本地：
   ```bash
   git clone [https://github.com/JustKeepSilence/OmniAI-Exporter.git](https://github.com/JustKeepSilence/OmniAI-Exporter.git)
   ```
2. 进入项目目录并安装依赖：
   ```bash
   cd OmniAI-Exporter
   npm install
   ```
3. 编译打包项目：
   ```bash
   npm run build
   ```
4. 打开 Chrome 或 Edge 浏览器，进入扩展程序管理页面（`chrome://extensions/`）。
5. 开启右上角的 **“开发者模式”**。
6. 点击 **“加载已解压的扩展程序”**，选择项目生成的 `dist` 文件夹即可。

## 🚀 使用方法 (Usage)

1. 打开任意一个受支持的 AI 对话页面。
2. 在页面侧边栏或悬浮球中唤出 OmniAI Exporter 菜单。
3. 选择你需要的导出格式。
4. 享受极其纯净的本地文档！

## 🤝 参与贡献 (Contributing)

前端页面的 DOM 结构瞬息万变，如果你发现了任何适配失效的 Bug，或者想添加新的 AI 平台支持，非常欢迎提交 Issue 或 Pull Request！

## 📄 开源协议 (License)

本项目基于 MIT 协议开源。