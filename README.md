# 🚀 OmniAI Exporter

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

OmniAI Exporter is a highly robust browser extension dedicated to providing developers, researchers, and heavy AI users with the **purest and highest-definition** AI conversation export experience. 

## 🛡️ Absolute Privacy & Security (Privacy-First)

**We understand that your AI conversations may contain highly sensitive business secrets and personal privacy.**
Therefore, OmniAI Exporter strictly adheres to a **"100% Local Browser Execution"** architecture:
* 🚫 **Zero Backend Dependency**: The extension contains absolutely NO API calls to any external servers.
* 🚫 **Zero Data Tracking**: All your conversation data, code snippets, and extraction logs are processed entirely in your local browser memory and destroyed immediately after use.
* ✅ **Enterprise-Grade Security**: We have no access to your data. Feel completely safe using it in the most confidential enterprise development environments.

## ✨ Key Features

* 🧹 **Physical-Level DOM Purification**: Accurately excises ads, video recommendations, copy buttons, and hidden data (like `script`/`style` tags) from major AI platforms, leaving only the pure knowledge.
* 💻 **Native Code Block Rescue**:
  * Perfectly preserves original line breaks (prevents compression and deformation).
  * Cross-node language tag extraction (supports C#, Python, Bash, etc.) for flawless downstream syntax highlighting.
  * Completely eliminates line number pollution and redundant rendering `<span>` tags.
* 📊 **Table Anti-Fragmentation**: Employs a dimensionality-reduction algorithm for complex nested tables (e.g., `<th><div>`) to ensure exported Markdown tables are perfectly aligned and intact.
* 🎯 **Seamless Multi-Platform Adaptation**: Utilizes Virtual List scanning and customized radar detection to accurately distinguish User and AI message sequences without cross-talk.
* 🏷️ **Smart Title Extraction**: Automatically reads context or `document.title` to generate highly recognizable export filenames, saying goodbye to messy timestamps.

## 📥 Export Formats & Roadmap

We are committed to providing an all-scenario export solution. Here are the currently supported formats and our technical roadmap:

| Export Format | Core Technology | Key Advantages | Limitations / Trade-offs | Status |
| :--- | :--- | :--- | :--- | :---: |
| **PDF (Native)** | `window.print()` | 🚀 **Perfect typography**, vector HD text, extremely fast rendering, small file size. | Requires manual confirmation via the system print dialog. | ✅ Supported |
| **Markdown** | `Turndown.js` + Purification | 100% pure, perfect for Notion/Obsidian secondary editing. | No significant drawbacks. | ✅ Supported |
| **Plain Text** | Native `textContent` | Extremely lightweight, universally compatible. | Loses images, bold text, and table formatting. | ✅ Supported |
| **JSON** | Structured Serialization | Includes Role and raw structure, perfect for data analysis & LLM fine-tuning. | Not ideal for non-technical users to read directly. | ✅ Supported |
| *PDF (Silent)* | `html2pdf.js` / `jsPDF` | One-click silent background download. | Speed depends on DOM size; super long chats may have page break issues. | 🚧 Planned |
| *Long Image* | `html2canvas` | Pixel-perfect WYSIWYG, best for social media sharing. | High memory usage; extremely long chats may crash canvas. | 🚧 Planned |
| *Word (Docx)* | `html-docx-js` | Meets traditional office and OA system needs. | Difficult to perfectly map complex CSS to Word XML. | 🚧 Planned |

## 📦 Supported Platforms

Currently, it perfectly supports the Web versions of the most powerful mainstream Large Language Models:

* [x] **ChatGPT** & **OpenAI**
* [x] **DeepSeek**
* [x] **Tencent Yuanbao** * [x] **Alibaba Qianwen** * [x] **Doubao** * [x] **Gemini**

## 🛠️ Installation From Source

Since this is currently a 1.0 Developer Version, please install it via "Load unpacked":

1. Clone this repository to your local machine:
   ```bash
   git clone [https://github.com/JustKeepSilence/OmniAI-Exporter.git](https://github.com/JustKeepSilence/OmniAI-Exporter.git)
   ```
2. Navigate to the project directory and install dependencies:
   ```bash
   cd OmniAI-Exporter
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Open your Chrome or Edge browser and navigate to the Extensions management page (`chrome://extensions/`).
5. Enable **"Developer mode"** in the top right corner.
6. Click **"Load unpacked"** and select the generated `dist` folder.

## 🚀 Usage

1. Open any supported AI conversation page.
2. Summon the OmniAI Exporter menu from the sidebar or floating action button.
3. Select your desired export format (PDF, Markdown, Text, or JSON).
4. Enjoy your exceptionally pure local document!

## 🤝 Contributing

The DOM structures of front-end pages are constantly changing. If you find any broken adaptations or want to add support for a new AI platform, Issues and Pull Requests are highly welcome!

## 📄 License

This project is open-sourced under the MIT License.