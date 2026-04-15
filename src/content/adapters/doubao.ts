import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class DoubaoAdapter implements SiteAdapter {
  siteName = 'Doubao'

  canHandle(): boolean {
    return window.location.hostname.includes('doubao.com')
  }

  pureDomClean(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement

    const garbageSelectors = [
      'button', 'svg', 'img', 
      '[class*="action"]', '[class*="copy"]', '[class*="reference"]',
      '.avatar-container'
    ]
    garbageSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(node => node.remove())
    })

    clone.querySelectorAll('pre').forEach(pre => {
      
        const wrapper = pre.parentElement
        if (wrapper && wrapper.tagName === 'DIV') {
            const header = wrapper.querySelector('.flex')
            if (header) header.remove()
        }
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

    clone.querySelectorAll('div, span').forEach(node => {
        if (!node.innerHTML.trim()) node.remove()
    })

    return clone.innerHTML.trim()
  }

  async extractHistory(isIncremental: boolean) {
    const dialogueId = window.location.pathname
    const exportedHashes = isIncremental ? await getExportedMemory(dialogueId) : new Set<string>()

    const messages: ChatMessage[] = []
    const hashesToMark: string[] = []

    const elements = document.querySelectorAll(
      '[data-message-id], [class*="message-item"], [class*="chat-message"]'
    ) 

    const processedNodes = new Set<HTMLElement>()

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement
      
      let parent = htmlEl.parentElement
      while (parent) {
        if (processedNodes.has(parent)) return
        parent = parent.parentElement
      }
      processedNodes.add(htmlEl)

      let targetNode = htmlEl.querySelector('.markdown-body') as HTMLElement
      if (!targetNode) targetNode = htmlEl 

      const pureHtml = this.pureDomClean(targetNode)

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = pureHtml
      const text = tempDiv.textContent?.trim() || ''

      if (!text) return

      const richTags = tempDiv.querySelectorAll('p, pre, code, ul, ol, li, h1, h2, h3, table, blockquote')
      
      let isUser = richTags.length === 0

      if (htmlEl.closest('.flex-row-reverse') !== null) {
          isUser = true
      }

      const msgHash = generateHash(text)
      if (isIncremental && exportedHashes.has(msgHash)) return 

      messages.push({
        role: isUser ? 'user' : 'ai',
        text: text,
        html: pureHtml 
      })

      hashesToMark.push(msgHash)
    })

    return { 
      data: messages, 
      hashesToMark, 
      dialogueId 
    }
  }
}