import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class QianwenAdapter implements SiteAdapter {
    siteName = 'Qianwen'

    canHandle(): boolean {
        return window.location.hostname.includes('qianwen.com')
    }

    pureDomClean(element: HTMLElement): string {
        const clone = element.cloneNode(true) as HTMLElement

        const garbageSelectors = [
            'button', 'svg', 'img', 'script', 'style',
            '[class*="action"]', '[class*="toolbar"]', '[class*="copy"]',
            '[data-c="result_card"]',       
            '[class*="card_video"]',        
            '[class*="video_note_list"]',   
            '[class*="reference-wrap"]'    
        ]
        garbageSelectors.forEach(sel => {
            try { clone.querySelectorAll(sel).forEach(node => node.remove()) } catch (e) { }
        })

        clone.querySelectorAll('pre').forEach(preNode => {

            preNode.querySelectorAll('[class*="line-number"], [class*="lineno"]').forEach(n => n.remove())

            const codeNode = preNode.querySelector('code') || preNode

            let savedLang = ''
            const prevSibling = preNode.previousElementSibling as HTMLElement
            if (prevSibling) {
                const text = prevSibling.textContent?.trim() || ''
                if (text.length < 20 && /[a-zA-Z]/.test(text)) {
                    let cleanLang = text.replace(/Copy code/ig, '').replace(/Copy/ig, '').replace(/复制/g, '')
                    cleanLang = cleanLang.replace(/[^a-zA-Z0-9#\+\-]/g, '').toLowerCase()
                    if (cleanLang) savedLang = cleanLang
                }
                prevSibling.remove() 
            }

            const langAliasMap: Record<string, string> = {
                'c#': 'csharp', 'c++': 'cpp', 'js': 'javascript', 'ts': 'typescript',
                'py': 'python', 'vue': 'xml', 'react': 'jsx', 'sh': 'bash', 'shell': 'bash', 'html': 'xml'
            }
            const standardLang = langAliasMap[savedLang] || savedLang

            let htmlStr = codeNode.innerHTML
            htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n')
            htmlStr = htmlStr.replace(/<\/div>|<\/p>|<\/li>/gi, '\n')

            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = htmlStr
            let rawText = tempDiv.textContent || ''

            rawText = rawText.replace(/\n{3,}/g, '\n\n').trim()

            const cleanPre = document.createElement('pre')
            const cleanCode = document.createElement('code')
            if (standardLang) {
                cleanCode.className = `language-${standardLang}`
            }
            cleanCode.textContent = rawText

            cleanPre.appendChild(cleanCode)
            preNode.parentNode?.replaceChild(cleanPre, preNode)
        })

        clone.querySelectorAll('th, td').forEach(cell => {
            cell.querySelectorAll('div, p').forEach(block => {
                const span = document.createElement('span')
                span.innerHTML = block.innerHTML
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

        const elements = document.querySelectorAll('[data-chat-list-key]')

        elements.forEach((el) => {
            const htmlEl = el as HTMLElement
            const key = htmlEl.getAttribute('data-chat-list-key') || ''

            let role: 'user' | 'ai' = 'user'
            let text = ''
            let pureHtml = ''

            if (key.endsWith('-question-A')) {
                role = 'ai'
                const contentNode = htmlEl.querySelector('[class*="content"]') as HTMLElement || htmlEl
                pureHtml = this.pureDomClean(contentNode)
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = pureHtml
                text = tempDiv.textContent?.trim() || ''
            } else if (key.endsWith('-question')) {
                role = 'user'
                const userNode = htmlEl.querySelector('[class*="questionItem"]') || htmlEl
                const clone = userNode.cloneNode(true) as HTMLElement
                clone.querySelectorAll('button, svg, [class*="action"]').forEach(n => n.remove())
                text = clone.textContent?.trim() || ''
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

        return {
            data: messages,
            hashesToMark,
            dialogueId
        }
    }
}