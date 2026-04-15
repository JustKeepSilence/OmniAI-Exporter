import JSZip from 'jszip'
import TurndownService from 'turndown'
import type { ChatMessage } from '../adapters/base'
import { type LogCallback, extractTitle } from '../adapters/base'

export async function generateCodeZip(data: ChatMessage[], _config: any, addLog: LogCallback) {

  addLog("log_codeStart_message")

  const zip = new JSZip()
  let codeCount = 0

  const extMap: Record<string, string> = {
    'python': 'py', 'javascript': 'js', 'typescript': 'ts', 'html': 'html',
    'css': 'css', 'json': 'json', 'java': 'java', 'cpp': 'cpp', 'c++': 'cpp',
    'c': 'c', 'csharp': 'cs', 'c#': 'cs', 'go': 'go', 'rust': 'rs',
    'bash': 'sh', 'shell': 'sh', 'sql': 'sql', 'xml': 'xml', 'yaml': 'yaml',
    'markdown': 'md', 'php': 'php', 'ruby': 'rb', 'swift': 'swift', 'vue': 'vue'
  }

  const fileIndexMap: Record<string, number> = {}

  const turndownService = new TurndownService({ codeBlockStyle: 'fenced' })

  data.forEach(msg => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = msg.html

    tempDiv.querySelectorAll('pre').forEach(preEl => {
      const codeEl = preEl.querySelector('code') || preEl
      let lang = ''

      const existingClass = Array.from(codeEl.classList).find(c => c.startsWith('language-'))
      if (existingClass) {
        lang = existingClass.replace('language-', '').trim()
      }

      if (!lang) {
        lang = codeEl.getAttribute('data-lang') || preEl.getAttribute('data-lang') || ''
      }

      if (!lang) {
        let current: HTMLElement | null = preEl
        for (let i = 0; i < 3; i++) {
          if (current && current.previousElementSibling) {
            let prevText = current.previousElementSibling.textContent?.trim().toLowerCase() || ''
            let possibleLang = prevText.replace(/[^a-z0-9+#]/g, '')
            if (extMap[possibleLang]) {
              lang = possibleLang
              break
            }
          }
          current = current?.parentElement || null
        }
      }

      if (lang) {
        lang = lang.replace(/[^a-z0-9+#]/g, '')
        codeEl.className = `language-${lang}`
      }
    })

    const mdText = turndownService.turndown(tempDiv.innerHTML)

    const regex = /```([a-zA-Z0-9+#]*)\n([\s\S]*?)```/g
    let match: string[] | null

    while ((match = regex.exec(mdText)) !== null) {
      let lang = match[1].toLowerCase().trim()
      const codeText = match[2].trim()

      if (!codeText) continue

      if (!lang || !extMap[lang]) lang = 'txt'

      const fileExt = extMap[lang] || 'txt'
      if (!fileIndexMap[lang]) fileIndexMap[lang] = 1
      const fileIndex = fileIndexMap[lang]++

      const folderName = lang === 'txt' ? 'Text_Unknown' : (lang.charAt(0).toUpperCase() + lang.slice(1))
      const fileName = `snippet_${fileIndex}.${fileExt}`

      zip.folder(folderName)?.file(fileName, codeText)
      codeCount++
    }
  })

  if (codeCount === 0) {
    return addLog("log_empty_message")
  }

  try {
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    const fileName = extractTitle()
    a.download = `${fileName}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addLog("log_success_message")
  } catch (err) {
    addLog("log_error_message", String(err))
  }
}