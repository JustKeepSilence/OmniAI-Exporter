import html2pdf from 'html2pdf.js'
// import {type Html2PdfOptions} from 'html2pdf.js'
import TurndownService from 'turndown'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { type ChatMessage } from '../adapters/base'
import { geekTheme, pureMinimalTheme } from '../styles/printThemes'
import { showGlobalLoading, hideGlobalLoading } from '../styles/loading'
import { type LogCallback, extractTitle } from '../adapters/base'
import { ICONS } from '../ui/icons'

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

turndownService.keep(['pre', 'code'])

turndownService.keep(function (node) {
  return ['svg', 'table', 'thead', 'tbody', 'tr', 'th', 'td'].includes(node.nodeName.toLowerCase());
})

//turndownService.keep(['svg', 'table', 'thead', 'tbody', 'tr', 'th', 'td'] as any[])

turndownService.addRule('math-formulas', {
  filter: function (node) {
    const tag = node.tagName.toLowerCase()

    if (tag === 'mjx-container' || tag === 'math') return true

    return node.classList && (
      node.classList.contains('katex') ||
      node.classList.contains('math-inline') ||
      node.classList.contains('math-block') ||
      node.classList.contains('MathJax')
    )
  },
  replacement: function (_content, node) {
    return (node as HTMLElement).outerHTML
  }
})

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs ',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    }
  })
)

const prepareMessages = async (messages: ChatMessage[]) => {
  const processed = []
  for (const msg of messages) {
    let mdText = turndownService.turndown(msg.html)

    if (msg.role === 'user') {
      mdText = mdText.replace(/^[\s#*]*(你说|You said)[\s*]*\n+/i, '')
    } else {
      mdText = mdText.replace(/^([\s#*]*)(Gemini\s*说|Gemini\s*said)/i, '$1')
    }

    const parsedContent = await marked.parse(mdText)
    processed.push({ role: msg.role, cleanHtml: parsedContent })
  }
  return processed
}

export const generatePDFNative = async (messages: ChatMessage[], config: any, onLog: LogCallback) => {
  const processedMessages = await prepareMessages(messages)
  let htmlContent = ''
  let aiLabel = 'AI Assistant'
  const host = window.location.hostname

  const labelStyle = "display: inline-flex; align-items: center; gap: 6px; font-weight: 800; letter-spacing: 0.5px;"
  const iconStyle = "width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;"

  if (host.includes('doubao')) {
    aiLabel = `<span style="${labelStyle}; color: #3b82f6;">
      <span style="${iconStyle}">${ICONS.DOUBAO}</span> Doubao
    </span>`
  }
  else if (host.includes('gemini')) {
    aiLabel = `<span style="${labelStyle};">
      <span style="${iconStyle}">${ICONS.GEMINI}</span> 
      <span style="background: linear-gradient(90deg, #4285f4, #9b72f3); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Gemini</span>
    </span>`
  }
  else if (host.includes('chatgpt') || host.includes('openai')) {
    aiLabel = `<span style="${labelStyle}; color: #10a37f;">
      <span style="${iconStyle}">${ICONS.CHATGPT}</span> ChatGPT
    </span>`
  }
  else if (host.includes('deepseek')) {
    aiLabel = `<span style="${labelStyle}; color: #4d6bfe;">
      <span style="${iconStyle}">${ICONS.DEEPSEEK}</span> DeepSeek
    </span>`
  }
  else if (host.includes('yuanbao')) {
    aiLabel = `<span style="${labelStyle}; color: #ff8200;">
      <span style="${iconStyle}">${ICONS.YUANBAO}</span> YuanBao
    </span>`
  }
  else if (host.includes('qianwen')) {
    aiLabel = `<span style="${labelStyle}; color: #615ced;">
      <span style="${iconStyle}">${ICONS.QIANWEN}</span> QianWen
    </span>`
  }

  for (const msg of processedMessages) {
    if (msg.role === 'user') {
      htmlContent += `<div class="msg-row user-row"><div class="msg-bubble user-bubble"><div class="msg-label">You Asked</div><div class="msg-content">${msg.cleanHtml}</div></div></div>`
    } else {
      htmlContent += `
        <div class="msg-row ai-row">
          <div class="msg-bubble ai-bubble">
            <div class="msg-label" style="display: flex; align-items: center; gap: 6px;">${aiLabel}</div>
            <div class="msg-content">${msg.cleanHtml}</div>
          </div>
        </div>`
    }
  }

  const titleName = extractTitle()

  const printContainer = document.createElement('div')
  printContainer.id = 'omni-print-container'

  printContainer.innerHTML = `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <style>
    #omni-print-container .msg-label {
      font-size: 11px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    #omni-print-container .msg-label svg {
      vertical-align: middle;
      opacity: 0.8;
    }
      #omni-print-container table {
        border-collapse: collapse;
        width: 100%;
        max-width: 100%;
        margin: 16px 0;
        font-size: 10.5px;
        page-break-inside: auto;
      }
      #omni-print-container tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      #omni-print-container th, 
      #omni-print-container td {
        border: 1px solid #cbd5e1 !important;
        padding: 6px 4px !important;
        text-align: left;
        white-space: normal !important;
        word-wrap: break-word !important;
        word-break: break-all !important;
      }
      #omni-print-container th {
        background-color: #f8fafc !important;
        font-weight: 600;
        color: #334155;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #omni-print-container pre code, 
      #omni-print-container pre code.hljs {
        color: #d4d4d4 !important;
        background: transparent !important;
      }
      
      #omni-print-container pre code span {
        color: inherit; 
      }

      @media print {
        html, body, #root, #app {
          height: auto !important;
          min-height: 100% !important;
          overflow: visible !important;
          display: block !important;
          position: static !important;
        }
        
        body > *:not(#omni-print-container):not(style):not(script) {
          display: none !important;
        }
        
        .msg-bubble, .msg-row {
           page-break-inside: auto !important;
           break-inside: auto !important;
           display: block !important;
        }
      }
    </style>
    
    <div class="print-content">
      ${config.includeMetadata ? `
        <div class="print-header">
          <div class="header-title">
            <h1>${titleName}</h1>
            <span class="header-badge">✨ Exported with OmniAI Exporter</span>
          </div>
          <p>Date: ${new Date().toLocaleString()} &nbsp;|&nbsp; Source: ${window.location.hostname}</p>
        </div>` : ''}
      ${htmlContent}
    </div>
  `
  document.body.appendChild(printContainer)

  const style = document.createElement('style')
  style.id = 'omni-print-style'
  style.textContent = geekTheme
  document.head.appendChild(style)

  onLog("log_savePdf_message")

  await new Promise(resolve => setTimeout(resolve, 800))

  try {
    window.print()
    onLog("log_success_message")
  } catch (err) {
    onLog("log_error_message", String(err))
  } finally {
    setTimeout(() => {
      if (document.body.contains(printContainer)) document.body.removeChild(printContainer)
      if (document.head.contains(style)) document.head.removeChild(style)
    }, 2000)
  }
}

export const generatePDFMarkdown = async (messages: ChatMessage[], _config: any, onLog: LogCallback) => {
  onLog("log_htmlPdfEngine_message")

  showGlobalLoading()

  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    const processedMessages = await prepareMessages(messages)
    let htmlContent = ''

    for (const msg of processedMessages) {
      const labelClass = msg.role === 'user' ? 'user' : 'ai'
      const labelText = msg.role === 'user' ? 'YOU ASKED' : 'AI'

      htmlContent += `
      <div class="role-label ${labelClass}">${labelText}</div>
      <div class="msg-content">${msg.cleanHtml}</div>
    `
    }

    const container = document.createElement('div')
    container.innerHTML = `
    <style>${pureMinimalTheme}</style>
    <div class="html2pdf-container">
      <h1 style="text-align: center color: #1f2937 margin-bottom: 5px">OmniAI Note</h1>
      <p style="text-align: center color: #9ca3af font-size: 12px border-bottom: 1px solid #e5e7eb padding-bottom: 20px">
        ${new Date().toLocaleString()} &nbsp|&nbsp Source: ${window.location.hostname}
      </p>
      ${htmlContent}
    </div>
  `

    const opt = {
      margin: 15,
      filename: `${extractTitle()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const, compress: true },


      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],

        avoid: ['pre', 'h3', 'h4', '.role-label', 'table', "p", "li"]
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200))
    await html2pdf().set(opt).from(container).save()
    onLog("log_success_message")
  } catch (err) {
    onLog("log_error_message", String(err))
  } finally {
    hideGlobalLoading()
  }


}