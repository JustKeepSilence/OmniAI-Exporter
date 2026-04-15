import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class GeminiAdapter implements SiteAdapter {
  siteName = 'Gemini'

  canHandle(): boolean {
    return window.location.hostname.includes('gemini.google.com')
  }

  pureDomClean(_element: HTMLElement): string {
    
    return ""

  }

  async extractHistory(isIncremental: boolean) {
    const dialogueId = window.location.pathname

    const exportedHashes = isIncremental ? await getExportedMemory(dialogueId) : new Set<string>()

    const messages: ChatMessage[] = []
    const hashesToMark: string[] = [] 

    const elements = document.querySelectorAll('user-query, model-response')

    elements.forEach((el) => {
      const tagName = el.tagName.toLowerCase()
      const isUser = tagName === 'user-query'
      
      const clone = el.cloneNode(true) as HTMLElement

      const originalCanvases = el.querySelectorAll('canvas')
      const clonedCanvases = clone.querySelectorAll('canvas')

      originalCanvases.forEach((canvas, index) => {
        try {
          const dataUrl = canvas.toDataURL('image/png')
          const img = document.createElement('img')
          img.src = dataUrl
          img.style.cssText = canvas.style.cssText
          img.style.maxWidth = '100%' 
          img.style.borderRadius = '8px'
          
          if (clonedCanvases[index] && clonedCanvases[index].parentNode) {
            clonedCanvases[index].parentNode?.replaceChild(img, clonedCanvases[index])
          }
        } catch (e) {
          console.warn("[OmniAI] Canvas failed:", e)
        }
      })

      clone.querySelectorAll('svg').forEach(svg => {
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        
        if (!svg.getAttribute('width') && !svg.style.width) {
          svg.style.maxWidth = '100%'
          svg.style.height = 'auto'
        }
      })

      const garbageSelectors = [
        'button',
        'button svg', 
        '.hidden',
        'img[src*="avatar"]',
        'message-actions',
        'skeleton-loader',      
        'response-feedback',   
        'copy-button'
      ]

      garbageSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(node => node.remove())
      })

      const text = clone.textContent?.trim() || ''
      const hasImage = clone.querySelector('img') !== null
      const hasSvg = clone.querySelector('svg') !== null
      const html = clone.innerHTML.trim()

      if (!text && !hasImage && !hasSvg) {
        return
      }

      const msgHash = generateHash(text || html)

      if (isIncremental && exportedHashes.has(msgHash)) {
        return 
      }

     
      messages.push({
        role: isUser ? 'user' : 'ai',
        text: text,
        html: html
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
