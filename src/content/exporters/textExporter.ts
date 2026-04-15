import type { ChatMessage } from '../adapters/base'
import { type LogCallback, extractTitle } from '../adapters/base'

export async function generateTXT(data: ChatMessage[], _config: any, addLog: LogCallback) {
  addLog("log_txtStart_message")
  
  const dateStr = new Date().toLocaleString()
  let txtContent = `OmniAI Exporter\nTime:${dateStr}\nTotal Items:${data.length} \n\n================================\n\n`

  data.forEach(msg => {
    const roleName = msg.role === 'user' ? 'YOU:' : 'AI:'
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = msg.html
    let text = tempDiv.textContent || tempDiv.innerText || ''
    
    txtContent += `${roleName}\n${text.trim()}\n\n--------------------------------\n\n`
  })

  downloadFile(txtContent, `${extractTitle()}.txt`, 'text/plain')
  addLog("log_success_message")
}

export async function generateJSON(data: ChatMessage[], _config: any, addLog: (msg: string) => void) {
  addLog("log_jsonStart_message")
  
  const jsonStr = JSON.stringify(data, null, 2)
  
  downloadFile(jsonStr, `${extractTitle()}.json`, 'application/json')
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