// src/content/exporters/wordExporter.ts
import type { ChatMessage } from '../adapters/base'
import { type LogCallback } from '../adapters/base'

export async function generateWord(data: ChatMessage[], _config: any, addLog: LogCallback) {
  addLog("log_wordStart_message")

  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>OmniAI Export</title>
      <style>
        body { font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif font-size: 11pt color: #333 }
        h1 { text-align: center color: #1e293b font-size: 18pt margin-bottom: 5px }
        .meta-info { text-align: center color: #64748b font-size: 9pt margin-bottom: 20px border-bottom: 1px solid #ccc padding-bottom: 10px }
        
        .role-user { font-weight: bold color: #475569 margin-top: 20px border-bottom: 2px solid #e2e8f0 padding-bottom: 5px }
        .role-ai { font-weight: bold color: #10b981 margin-top: 20px border-bottom: 2px solid #a7f3d0 padding-bottom: 5px }
        
        .msg-content { margin-top: 10px line-height: 1.5 }
        
        img { max-width: 100% height: auto }
        
        table { border-collapse: collapse width: 100% margin: 10px 0 }
        table, th, td { border: 1px solid #94a3b8 padding: 6px }
        th { background-color: #f1f5f9 }
      </style>
    </head>
    <body>
      <h1>OmniAI Chat Report</h1>
      <div class="meta-info">Export Time：${new Date().toLocaleString()} | Total Items:${data.length}</div>
  `

  const footer = "</body></html>"

  let bodyContent = ""
  data.forEach(msg => {
    const isUser = msg.role === 'user'
    const roleClass = isUser ? 'role-user' : 'role-ai'
    const roleName = isUser ? '👤 YOU ASKED:' : '✨ AI RESPONDED:'
    
    bodyContent += `
      <div class="${roleClass}">${roleName}</div>
      <div class="msg-content">${msg.html}</div>
    `
  })

  const finalHtml = header + bodyContent + footer

  const blob = new Blob(['\ufeff', finalHtml], { 
    type: 'application/mswordcharset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  
  a.download = `OmniAI_Export_${Date.now()}.doc` 
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  addLog("log_success_message")
}