export interface ChatMessage {

  role: 'user' | 'ai'

  text: string

  html: string

}

export interface SiteAdapter {

  siteName: string

  canHandle(): boolean

  extractHistory(isIncremental: boolean): Promise<{
    data: ChatMessage[]
    hashesToMark: string[]
    dialogueId: string
  }>

  pureDomClean(element: HTMLElement): string
}

export type LogCallback = (msgOrKey: string, args?: string | string[]) => void

export const sanitizeAndSolidifyDOM = (element: HTMLElement): string => {
  const clone = element.cloneNode(true) as HTMLElement

  const originalCanvases = element.querySelectorAll('canvas')
  const clonedCanvases = clone.querySelectorAll('canvas')

  originalCanvases.forEach((canvas, index) => {
    try {
      const imgData = canvas.toDataURL('image/png')
      const img = document.createElement('img')
      img.src = imgData
      img.style.cssText = canvas.style.cssText 
      img.style.maxWidth = '100%'

      if (clonedCanvases[index] && clonedCanvases[index].parentNode) {
        clonedCanvases[index].parentNode?.replaceChild(img, clonedCanvases[index])
      }
    } catch (e) {
    }
  })

  clone.querySelectorAll('svg').forEach(svg => {
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    if (!svg.getAttribute('width') && !svg.style.width) {
      svg.style.maxWidth = '100%'
      svg.style.height = 'auto'
    }
  })

  return clone.innerHTML
}

export const extractTitle = (): string=>{

  let title = ''

    const titleNode = document.querySelector('[class*="titleText"], [class*="header-title"], .header-text')
    if (titleNode) {
      title = titleNode.textContent?.trim() || ''
    }

    if (!title) {
      title = document.title
      title = title.replace(/-?\s*(通义千问|DeepSeek|腾讯元宝|ChatGPT|Google Gemini|豆包).*$/i, '').trim()
    }

    if (!title) {
      const now = new Date()
      title = `OmniAI_Export_${now.getMonth() + 1}${now.getDate()}`
    }

    return title.replace(/[\\/:*?"<>|]/g, '_').trim()

} 
