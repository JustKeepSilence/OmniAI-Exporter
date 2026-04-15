import TurndownService from 'turndown'
import type { ChatMessage } from '../adapters/base'
import { type LogCallback, extractTitle } from '../adapters/base'
import { gfm, tables } from 'turndown-plugin-gfm'

export async function generateMarkdown(
  data: ChatMessage[], 
  _config: any, 
  addLog: LogCallback
) {
  addLog("log_markdownEngine_message")

  const turndownService = new TurndownService({
    headingStyle: 'atx', 
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })

  turndownService.use(tables)
  turndownService.use(gfm)

  turndownService.keep(['pre', 'code'])

  addLog('log_markdownTransfer_message')

  const dateStr = new Date().toLocaleString()
  let mdContent = `# OmniAI Exporter \n\n> **Time:** ${dateStr}\n> **Total Items:** ${data.length}\n\n---\n\n`

  data.forEach((msg, _index) => {
    const roleName = msg.role === 'user' ? '👤 **YOU**' : '🤖 **AI**'
    
    let mdText = turndownService.turndown(msg.html)

    mdContent += `### ${roleName}\n\n${mdText}\n\n---\n\n`
  })

  addLog("log_markdownOk_message")

  const fileName = extractTitle()

  downloadFile(mdContent, `${fileName}.md`, 'text/markdown')
  
  addLog("log_success_message")
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}