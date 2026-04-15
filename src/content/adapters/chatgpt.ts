// src/adapters/chatgpt.ts
import { type SiteAdapter, type ChatMessage } from './base'
import { generateHash, getExportedMemory } from '../memory'

export class ChatGPTAdapter implements SiteAdapter {
    siteName = 'ChatGPT'

    canHandle(): boolean {
        return window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com')
    }

    pureDomClean(element: HTMLElement): string {
        const clone = element.cloneNode(true) as HTMLElement

        const headers = clone.querySelectorAll('.bg-token-bg-elevated-secondary, .flex.w-full.items-center.justify-between')

        headers.forEach(headerDiv => {
            const codeBlockContainer = headerDiv.parentElement
            if (!codeBlockContainer || codeBlockContainer === clone) return

            const contentNode = codeBlockContainer.querySelector('.cm-content') || codeBlockContainer.querySelector('code')
            if (!contentNode) return

            let rawText = headerDiv.textContent || ''
            let langText = rawText.replace(/Copy code/ig, '').replace(/Copy/ig, '').replace(/复制/g, '').trim()
            const extractedLang = langText.toLowerCase()

            const langAliasMap: Record<string, string> = {
                'c#': 'csharp', 'c++': 'cpp', 'js': 'javascript', 'ts': 'typescript',
                'py': 'python', 'vue': 'xml', 'react': 'jsx', 'sh': 'bash', 'shell': 'bash', 'html': 'xml'
            }
            const standardLang = langAliasMap[extractedLang] || extractedLang

            let fallbackLang = ''
            if (contentNode.tagName === 'CODE') {
                const classes = Array.from(contentNode.classList)
                const existing = classes.find(c => c.startsWith('language-'))
                if (existing) fallbackLang = existing.replace('language-', '')
            }

            const finalLangClass = standardLang ? `language-${standardLang}` : (fallbackLang ? `language-${fallbackLang}` : '')

            let htmlStr = contentNode.innerHTML
            htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n')
            htmlStr = htmlStr.replace(/<\/div>|<\/p>|<\/li>|<\/tr>/gi, '\n')
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = htmlStr
            let codeText = tempDiv.textContent || ''
            codeText = codeText.replace(/\n{3,}/g, '\n\n').trim()

            const cleanPre = document.createElement('pre')
            const cleanCode = document.createElement('code')
            if (finalLangClass) cleanCode.className = finalLangClass
            cleanCode.textContent = codeText

            cleanPre.appendChild(cleanCode)

            codeBlockContainer.parentNode?.replaceChild(cleanPre, codeBlockContainer)
        })

        clone.querySelectorAll('pre').forEach(pre => {
            let savedLang = ''

            pre.querySelectorAll('div').forEach(div => {
                const text = div.textContent?.trim() || ''
                if (text.length < 30 && (div.className.includes('flex') || div.querySelector('svg'))) {
                    let cleanLangName = text.replace(/Copy code/ig, '').replace(/Copy/ig, '').trim()
                    if (cleanLangName) {
                        savedLang = cleanLangName.toLowerCase()
                    }
                    div.remove()
                }
            })

            const codeNode = pre.querySelector('[class*="language-"]') || pre.querySelector('code') || pre

            const classes = Array.from(codeNode.classList)
            const existingLang = classes.find(c => c.startsWith('language-'))

            let rawLang = existingLang ? existingLang.replace('language-', '') : savedLang
            let leakedCode = ''

            const stickyLangRegex = /^(c#|c\+\+|cpp|csharp|js|javascript|ts|typescript|py|python|bash|shell|sh|html|xml|json|css|sql|java)([a-zA-Z]{2,}.*)?$/i
            const match = rawLang.match(stickyLangRegex)

            if (match) {
                rawLang = match[1].toLowerCase() 
                if (match[2]) {
                    leakedCode = match[2] 
                }
            }

            const langAliasMap: Record<string, string> = {
                'c#': 'csharp', 'c++': 'cpp', 'js': 'javascript', 'ts': 'typescript',
                'py': 'python', 'vue': 'xml', 'react': 'jsx', 'sh': 'bash', 'shell': 'bash', 'html': 'xml'
            }

            let standardLang = langAliasMap[rawLang] || rawLang
            let finalLangClass = standardLang ? `language-${standardLang}` : ''

            let rawText = ''
            const divLines = codeNode.querySelectorAll('div')
            if (divLines.length > 0) {
                divLines.forEach(line => {
                    rawText += (line.textContent || '') + '\n'
                })
            } else {
                rawText = codeNode.textContent || ''
            }

            if (leakedCode && !rawText.trim().toLowerCase().startsWith(leakedCode.toLowerCase())) {
                rawText = leakedCode + ' ' + rawText.trimStart()
            }

            const cleanPre = document.createElement('pre')
            const cleanCode = document.createElement('code')
            if (finalLangClass) {
                cleanCode.className = finalLangClass 
            }

            cleanCode.textContent = rawText.trim()

            cleanPre.appendChild(cleanCode)
            pre.parentNode?.replaceChild(cleanPre, pre)
        })

        const garbageSelectors = [
            'button', 'svg', 'img', '.sr-only', '[class*="action"]'
        ]
        garbageSelectors.forEach(sel => {
            try { clone.querySelectorAll(sel).forEach(node => node.remove()) } catch (e) { }
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


        const elements = document.querySelectorAll('article, [data-message-author-role], [data-testid*="conversation-turn"]')

        const processedNodes = new Set<HTMLElement>()

        elements.forEach((el) => {
            const htmlEl = el as HTMLElement


            let parent = htmlEl.parentElement
            while (parent) {
                if (processedNodes.has(parent)) return
                parent = parent.parentElement
            }
            processedNodes.add(htmlEl)

            const roleAttr = htmlEl.getAttribute('data-message-author-role') ||
                (htmlEl.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role'))

            const isUser = roleAttr === 'user'

            let targetNode = htmlEl.querySelector('.markdown') as HTMLElement
            if (!targetNode) {
                const preWrapNodes = htmlEl.querySelectorAll('.whitespace-pre-wrap')
                if (preWrapNodes.length > 0) {
                    targetNode = preWrapNodes[preWrapNodes.length - 1] as HTMLElement
                } else {
                    targetNode = htmlEl
                }
            }

            const pureHtml = this.pureDomClean(targetNode)

            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = pureHtml
            const text = tempDiv.textContent?.trim() || ''

            if (!text) return

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