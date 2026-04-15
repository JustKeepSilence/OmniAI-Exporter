import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class YuanbaoAdapter implements SiteAdapter {
  siteName = 'Yuanbao'

  canHandle(): boolean {
    return window.location.hostname.includes('yuanbao.tencent.com') 
  }

  pureDomClean(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement

    const garbageSelectors = [
      'button', 'svg', 'img', 
      '.agent-chat__code-block__header', 
      '.agent-chat__toolbar'           
    ]
    garbageSelectors.forEach(sel => {
      try { clone.querySelectorAll(sel).forEach(node => node.remove()) } catch(e) {}
    })

    clone.querySelectorAll('pre').forEach(preNode => {
      const codeNode = preNode.querySelector('code')
      
      if (codeNode) {
        const langClass = Array.from(codeNode.classList).find(c => c.startsWith('language-')) || ''

        let htmlStr = codeNode.innerHTML
        
        htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n')
        htmlStr = htmlStr.replace(/<\/div>|<\/p>|<\/li>/gi, '\n')
        htmlStr = htmlStr.replace(/<\/span>(?=\s*<span)/gi, '</span>\n')
        
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = htmlStr
        let rawText = tempDiv.textContent || ''
        
        rawText = rawText.replace(/\n{3,}/g, '\n\n').trim()

        const cleanPre = document.createElement('pre')
        const cleanCode = document.createElement('code')
        if (langClass) {
            cleanCode.className = langClass 
        }
        
        cleanCode.textContent = rawText 
        cleanPre.appendChild(cleanCode)
        preNode.parentNode?.replaceChild(cleanPre, preNode)
      }
    })

    clone.querySelectorAll('th, td').forEach(cell => {
      cell.querySelectorAll('div, p').forEach(block => {
        const span = document.createElement('span')
        block.parentNode?.replaceChild(span, block)
      })
      
      cell.innerHTML = cell.innerHTML.replace(/\n/g, ' ')
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

    const elements = document.querySelectorAll('.agent-chat__list__item')

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const speaker = htmlEl.getAttribute('data-conv-speaker') 

      let role: 'user' | 'ai' = 'user'
      let text = ''
      let pureHtml = ''

      if (speaker === 'ai') {
        role = 'ai'
        const mdNode = htmlEl.querySelector('.hyc-markdown') as HTMLElement || htmlEl.querySelector('.agent-chat__bubble__content') as HTMLElement
        
        if (mdNode) {
            pureHtml = this.pureDomClean(mdNode)
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = pureHtml
            text = tempDiv.textContent?.trim() || ''
        }
      } else if (speaker === 'user') {
        role = 'user'
        const userNode = htmlEl.querySelector('.agent-chat__bubble__content') as HTMLElement || htmlEl
        
        const userClone = userNode.cloneNode(true) as HTMLElement
        userClone.querySelectorAll('.agent-chat__toolbar, button, svg').forEach(n => n.remove())
        
        text = userClone.textContent?.trim() || ''
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