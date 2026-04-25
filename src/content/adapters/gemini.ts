import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class GeminiAdapter implements SiteAdapter {
  siteName = 'Gemini'

  canHandle(): boolean {
    return window.location.hostname.includes('gemini.google.com')
  }

  pureDomClean(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement

    const originalCanvases = element.querySelectorAll('canvas')
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
      '.hidden',
      'img[src*="avatar"]',
      'message-actions',
      'skeleton-loader',
      'response-feedback',
      'copy-button'
    ]
    garbageSelectors.forEach(sel => {
      try { clone.querySelectorAll(sel).forEach(node => node.remove()) } catch (e) { }
    })

    clone.querySelectorAll('pre').forEach(preNode => {
      const codeNode = preNode.querySelector('code')
      if (!codeNode) return

      let langClass = Array.from(codeNode.classList).find(c => c.startsWith('language-')) || ''

      if (!langClass) {
        let lang = ''
        let currentNode: HTMLElement | null = preNode
        for (let i = 0; i < 3; i++) {
          if (!currentNode) break
          const prevSibling = currentNode.previousElementSibling as HTMLElement
          if (prevSibling) {
            const text = prevSibling.innerText || ''
            const cleanText = text.split('\n')[0].replace(/(copy|复制|code|代码)/gi, '').trim()
            if (cleanText && cleanText.length > 0 && cleanText.length < 20) {
              lang = cleanText.toLowerCase()
              break
            }
          }
          currentNode = currentNode.parentElement
        }
        if (lang) {
          const normalizedLang = lang.replace('c++', 'cpp').replace('c#', 'csharp').replace(/[^a-z0-9+#-]/g, '')
          langClass = `language-${normalizedLang}`
        }
      }

      let htmlStr = codeNode.innerHTML
      htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n')
      htmlStr = htmlStr.replace(/<\/div>|<\/p>|<\/li>/gi, '\n')

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
        if (node.tagName === 'IMG' && (attr.name === 'src' || attr.name === 'style')) return
        if (node.tagName === 'SVG' && (attr.name === 'xmlns' || attr.name === 'style')) return

        node.removeAttribute(attr.name)
      })
    })

    clone.querySelectorAll('div, p, span').forEach(node => {
      if (!node.textContent?.trim() && !node.querySelector('img') && !node.querySelector('svg')) {
        node.remove()
      }
    })

    return clone.innerHTML.trim()
  }

  async extractHistory(isIncremental: boolean) {
    const dialogueId = window.location.pathname
    const exportedHashes = isIncremental ? await getExportedMemory(dialogueId) : new Set<string>()

    const messages: ChatMessage[] = []
    const hashesToMark: string[] = []

    const elements = document.querySelectorAll('user-query, model-response')

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const tagName = htmlEl.tagName.toLowerCase()
      const isUser = tagName === 'user-query'

      const pureHtml = this.pureDomClean(htmlEl)

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = pureHtml
      const text = tempDiv.textContent?.trim() || ''

      const hasImage = htmlEl.querySelector('canvas') !== null || htmlEl.querySelector('img') !== null
      const hasSvg = htmlEl.querySelector('svg') !== null

      if (!text && !hasImage && !hasSvg) {
        return
      }

      const msgHash = generateHash(text || pureHtml)

      if (isIncremental && exportedHashes.has(msgHash)) {
        return
      }

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
