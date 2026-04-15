import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class DeepSeekAdapter implements SiteAdapter {
  siteName = 'DeepSeek'

  canHandle(): boolean {
    return window.location.hostname.includes('deepseek.com')
  }

  pureDomClean(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement

    clone.querySelectorAll('.md-code-block').forEach(block => {
      let savedLang = ''

      const banner = block.querySelector('.md-code-block-banner-wrap')
      if (banner) {
          const text = banner.textContent?.trim() || ''
          let cleanText = text.replace(/Copy code/ig, '').replace(/Copy/ig, '').replace(/复制/g, '')
          let cleanLangName = cleanText.replace(/[^a-zA-Z0-9#\+\-]/g, '').toLowerCase()
          if (cleanLangName) {
              savedLang = cleanLangName
          }
          banner.remove() 
      }

      const langAliasMap: Record<string, string> = {
          'c#': 'csharp', 'c++': 'cpp', 'js': 'javascript', 'ts': 'typescript',
          'py': 'python', 'vue': 'xml', 'react': 'jsx', 'sh': 'bash', 'shell': 'bash', 'html': 'xml'
      }
      const standardLang = langAliasMap[savedLang] || savedLang
      const finalLangClass = standardLang ? `language-${standardLang}` : ''

      let htmlStr = block.innerHTML
      htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n')
      htmlStr = htmlStr.replace(/<\/div>|<\/p>|<\/li>/gi, '\n')
      
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlStr
      let rawText = tempDiv.textContent || ''
      
      rawText = rawText.replace(/\n{3,}/g, '\n\n').trim()

      const cleanPre = document.createElement('pre')
      const cleanCode = document.createElement('code')
      
      if (finalLangClass) {
          cleanCode.className = finalLangClass 
      }
      
      cleanCode.textContent = rawText 

      cleanPre.appendChild(cleanCode)
      
      block.parentNode?.replaceChild(cleanPre, block)
    })

    const garbageSelectors = ['button', 'svg', 'img']
    garbageSelectors.forEach(sel => {
      try { clone.querySelectorAll(sel).forEach(node => node.remove()) } catch(e) {}
    })

    const allNodes = clone.querySelectorAll('*')
    allNodes.forEach(node => {
      const attrs = Array.from(node.attributes)
      attrs.forEach(attr => {
        if (attr.name === 'href') return
        if (attr.name === 'class' && (node.tagName === 'CODE' || node.tagName === 'PRE')) return
        node.removeAttribute(attr.name)
      })
    })

    clone.querySelectorAll('div, p, span').forEach(node => {
        if (!node.textContent?.trim()) node.remove()
    })

    return clone.innerHTML.trim()
  }

  async extractHistory(isIncremental: boolean) {
    const dialogueId = window.location.pathname
    const exportedHashes = isIncremental ? await getExportedMemory(dialogueId) : new Set<string>()

    const messages: ChatMessage[] = []
    const hashesToMark: string[] = []

    const elements = document.querySelectorAll('[data-virtual-list-item-key]')

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement

      const aiNode = htmlEl.querySelector('.ds-markdown') as HTMLElement
      const userNode = htmlEl.querySelector('.ds-message') as HTMLElement

      let role: 'user' | 'ai' = 'user'
      let text = ''
      let pureHtml = ''

      if (aiNode) {
        role = 'ai'
        pureHtml = this.pureDomClean(aiNode)
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = pureHtml
        text = tempDiv.textContent?.trim() || ''
      } else if (userNode) {
        role = 'user'
        text = userNode.textContent?.trim() || ''
        pureHtml = `<div>${text}</div>`
      } else {
        return
      }

      if (!text) return

      const msgHash = generateHash(text)
      if (isIncremental && exportedHashes.has(msgHash)) return

      messages.push({
        role: role,
        text: text,
        html: pureHtml
      })

      hashesToMark.push(msgHash)
    })

    console.log('messages', JSON.stringify(messages))

    return {
      data: messages,
      hashesToMark,
      dialogueId
    }
  }
}