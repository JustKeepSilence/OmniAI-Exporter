import sidebarTemplate from './sidebar.html?raw'
import sidebarStyles from './sidebar.css?inline'
import { getActiveAdapter } from './adapters'
import { generatePDFNative, generatePDFMarkdown } from './exporters/pdfExporter'
import type { ChatMessage } from './adapters/base'
import { generateMarkdown } from './exporters/markdownExporter'
import { generateTXT, generateJSON } from './exporters/textExporter'
import { generateImage } from './exporters/imageExporter'
import { generateWord } from './exporters/wordExporter'
import { generateCodeZip } from './exporters/codeExporter'
import { saveExportedMemory, getIncrementalToggleState, saveIncrementalToggleState, clearExportedMemory } from './memory'

import { ICONS } from './ui/icons'

const exportConfig = {
  excludeUserMessages: false,
  includeMetadata: true,
  enablePdfToc: false,
  pdfEngine: 'native',
  enableLogging: true,
  enableIncremental: false,
  filenameTemplate: '{{site}}_{{topic}}_{{date}}'
}

function applyI18n(root: ShadowRoot | HTMLElement) {
  const elements = root.querySelectorAll('[data-i18n]')
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (key) {
      const translatedText = chrome.i18n.getMessage(key)
      if (translatedText) {
        if (el instanceof HTMLInputElement && el.type === 'text') {
          el.placeholder = translatedText
        } else {
          el.textContent = translatedText
        }
      }
    }
  })

  const tooltipElements = root.querySelectorAll('[data-i18n-tooltip]')
  tooltipElements.forEach(el => {
    const key = el.getAttribute('data-i18n-tooltip')
    if (key) {
      const translatedText = chrome.i18n.getMessage(key)
      if (translatedText) {
        el.setAttribute('data-tooltip', translatedText)
      }
    }
  })
}


function initOmniUI() {
  const host = document.createElement('div')
  host.id = 'omni-ai-exporter-root'
  host.style.cssText = 'position: fixed top: 0 left: 0 z-index: 2147483647'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const styleSheet = document.createElement('style')
  styleSheet.textContent = sidebarStyles
  shadow.appendChild(styleSheet)

  const container = document.createElement('div')
  const win = window as any
  if (win.trustedTypes && win.trustedTypes.createPolicy) {

    const policyName = 'omni-ai-policy'
    let policy
    try {
      policy = win.trustedTypes.createPolicy(policyName, {
        createHTML: (str: string) => str,
      })
    } catch (e) {

      policy = { createHTML: (str: string) => str }
    }
    container.innerHTML = policy.createHTML(sidebarTemplate)
  } else {

    container.innerHTML = sidebarTemplate
  }

  shadow.appendChild(container)

  const $ = (id: string) => shadow.getElementById(id) as HTMLElement

  getIncrementalToggleState().then((isSavedEnabled) => {
    exportConfig.enableIncremental = isSavedEnabled
    const toggleIncremental = $('cfg-incremental') as HTMLInputElement
    if (toggleIncremental) {
      toggleIncremental.checked = isSavedEnabled
    }
  })

  const sidebar = $('sidebar')

  const toggleSidebar = () => sidebar.classList.toggle('open')
  $('fab').addEventListener('click', toggleSidebar)
  $('close-btn').addEventListener('click', toggleSidebar)

  applyI18n(shadow)

  const bindToggle = (id: string, key: keyof typeof exportConfig) => {
    const el = $(id) as HTMLInputElement
    if (!el)
      return
    el.addEventListener('change', (e) => {
      (exportConfig as any)[key] = (e.target as HTMLInputElement).checked
    })
  }

  bindToggle('cfg-exclude-user', 'excludeUserMessages')
  bindToggle('cfg-meta', 'includeMetadata')
  bindToggle('cfg-toc', 'enablePdfToc')
  bindToggle('cfg-logging', 'enableLogging')
  $('cfg-incremental')?.addEventListener('change', async (e) => {
    const isChecked = (e.target as HTMLInputElement).checked
    exportConfig.enableIncremental = isChecked
    await saveIncrementalToggleState(isChecked)

    addLog(isChecked ? "log_incremental_start_message" : "log_incremental_pause_message")
  })

  $('cfg-logging').addEventListener('change', (e) => {
    const isEnabled = (e.target as HTMLInputElement).checked
    if (!isEnabled) {
      $('status-area').style.display = 'none'
    }
  })

  $('btn-clear-log').addEventListener('click', () => {
    const consoleArea = $('log-console')
    consoleArea.innerHTML = ''
  })

  $('btn-clear-memory')?.addEventListener('click', async () => {
    const dialogueId = window.location.pathname

    await clearExportedMemory(dialogueId)

    addLog("log_incremental_clear_message")

    const btn = $('btn-clear-memory')
    const originalHtml = btn.innerHTML

    btn.innerHTML = `<span style="color: #10b981 font-weight: bold">✅Cleared</span>`
    setTimeout(() => {
      btn.innerHTML = originalHtml
    }, 1500)
  })

  const engineRadios = shadow.querySelectorAll('input[name="pdf-engine"]')
  engineRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      exportConfig.pdfEngine = (e.target as HTMLInputElement).value
      addLog("log_engine_change_message", exportConfig.pdfEngine.toUpperCase())
    })
  })

  const addLog = (msgOrKey: string, args?: string | string[]) => {

    if (!exportConfig.enableLogging) return
    const area = $('status-area')
    const console = $('log-console')
    area.style.display = 'flex'
    const translated = chrome.i18n.getMessage(msgOrKey, args)
    const finalMsg = translated ? translated : msgOrKey
    const line = document.createElement('div')
    line.className = 'log-item'
    line.innerText = `> ${new Date().toLocaleTimeString()}: ${finalMsg}`
    console.appendChild(line)
    console.scrollTop = console.scrollHeight
  }

  // check site
  const checkSite = () => {
    const adapter = getActiveAdapter()
    if (!adapter) return addLog("log_unsupported_message")
  }

  checkSite()

  const injectIconsAndActiveState = () => {
    const hostname = window.location.hostname

    const hostMap: Record<string, string> = {
      'gemini.google.com': 'GEMINI',
      'chatgpt.com': 'CHATGPT',
      'chat.openai.com': 'CHATGPT',
      'doubao.com': 'DOUBAO',
      'qianwen.com': 'QIANWEN',
      'yuanbao.tencent.com': 'YUANBAO',
      'chat.deepseek.com': 'DEEPSEEK'
    }

    const matchedKey = Object.keys(hostMap).find(key => hostname.includes(key))
    const currentActiveKey = matchedKey ? hostMap[matchedKey] : null

    const sanitizeAndScaleSVG = (raw: string) => {
      let clean = raw.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<\?xml[^>]*\?>/i, '')
      clean = clean.replace('<svg', '<svg class="omni-svg-icon" style="width:100% height:100% display:block"')
      return clean.trim()
    }

    const slots = shadow.querySelectorAll('[data-icon]')
    slots.forEach(slot => {
      const iconKey = slot.getAttribute('data-icon') as keyof typeof ICONS

      if (ICONS[iconKey]) {
        slot.innerHTML = sanitizeAndScaleSVG(ICONS[iconKey])
      }

      if (slot.classList.contains('platform-icon')) {
        if (currentActiveKey && iconKey === currentActiveKey) {
          slot.classList.add('active')
        } else {
          slot.classList.remove('active')
        }
      }
    })
  }

  injectIconsAndActiveState()

  $('btn-pdf')?.addEventListener('click', async () => {
    const adapter = getActiveAdapter()
    if (!adapter) return

    const btnPdf = $('btn-pdf') as HTMLButtonElement
    const pdfLabel = btnPdf?.querySelector('.grid-label') as HTMLSpanElement
    const originalText = pdfLabel.innerText
    btnPdf.style.pointerEvents = 'none'
    btnPdf.style.opacity = '0.7'
    pdfLabel.innerText = '生成中...'
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      let { data, hashesToMark, dialogueId } = await adapter.extractHistory(exportConfig.enableIncremental)
      if (data.length === 0) {
        addLog('log_empty_message')
        return
      }
      if (exportConfig.excludeUserMessages) data = data.filter(m => m.role === 'ai')

      if (exportConfig.pdfEngine === 'native') {
        addLog("log_nativePdfEngine_message")
        await generatePDFNative(data, exportConfig, addLog)
      } else {
        addLog("log_htmlPdfEngine_message")
        await generatePDFMarkdown(data, exportConfig, addLog)
      }

      if (exportConfig.enableIncremental && hashesToMark.length > 0) {
        await saveExportedMemory(dialogueId, hashesToMark)
        addLog('log_incremental_position_message')
      }

    } catch (error) {
      addLog("log_error_message", String(error))
    } finally {
      btnPdf.style.pointerEvents = 'auto'
      btnPdf.style.opacity = '1'
      pdfLabel.innerText = originalText
    }
  })

  $('btn-extract-code')?.addEventListener('click', async () => {
    try {

      const adapter = getActiveAdapter()
      if (!adapter) return addLog("log_unsupported_message")

      let { data, hashesToMark, dialogueId } = await adapter.extractHistory(exportConfig.enableIncremental)
      if (data.length === 0) {
        addLog('log_empty_message')
        return
      }
      data = data.filter(m => m.role === 'ai')

      if (data.length === 0) {
        addLog('log_empty_message')
        return
      }

      await generateCodeZip(data, exportConfig, addLog)

      if (exportConfig.enableIncremental && hashesToMark.length > 0) {
        await saveExportedMemory(dialogueId, hashesToMark)
        addLog('log_incremental_position_message')
      }
    } catch (error) {
      addLog("log_error_message", String(error))
    }
  })

  const btnFeedback = $('btn-feedback')
  const feedbackModal = $('feedback-modal')
  const btnCloseFeedback = $('btn-close-feedback')

  if (btnFeedback && feedbackModal && btnCloseFeedback) {

    btnFeedback.addEventListener('click', () => {
      feedbackModal.style.display = 'flex'
    })


    btnCloseFeedback.addEventListener('click', () => {
      feedbackModal.style.display = 'none'
    })


    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) {
        feedbackModal.style.display = 'none'
      }
    })
  }

  const handleOneClickExport = async (format: 'md' | 'txt' | 'json' | 'img' | 'docx') => {
    const adapter = getActiveAdapter()
    if (!adapter) return addLog('log_unsupported_message')


    let { data, hashesToMark, dialogueId } = await adapter.extractHistory(exportConfig.enableIncremental)
    if (data.length === 0) {
      addLog('log_empty_message')
      return
    }
    if (exportConfig.excludeUserMessages) data = data.filter(m => m.role === 'ai')
    if (data.length === 0) {
      addLog('log_empty_message')
      return
    }

    addLog('log_export_message')

    try {
      if (format === 'md') await generateMarkdown(data, exportConfig, addLog)
      if (format === 'txt') await generateTXT(data, exportConfig, addLog)
      if (format === 'json') await generateJSON(data, exportConfig, addLog)
      if (format === 'img') await generateImage(data, exportConfig, addLog)
      if (format === 'docx') await generateWord(data, exportConfig, addLog)
      if (exportConfig.enableIncremental && hashesToMark.length > 0) {
        await saveExportedMemory(dialogueId, hashesToMark)
        addLog('log_incremental_position_message')
      }
    } catch (error) {
      addLog('log_error_message', String(error))
    }
  }

  $('btn-md')?.addEventListener('click', () => handleOneClickExport('md'))
  $('btn-json')?.addEventListener('click', () => handleOneClickExport('json'))
  $('btn-txt')?.addEventListener('click', () => handleOneClickExport('txt'))
  $('btn-img')?.addEventListener('click', () => handleOneClickExport('img'))
  $('btn-docx')?.addEventListener('click', () => handleOneClickExport('docx'))

  const WorkspaceManager = {
    cachedMessages: [] as ChatMessage[],
    selectedItems: new Set<ChatMessage>(),
    draggedItem: null as ChatMessage | null,
    selectedFormat: 'pdf',

    init() {

      const formatBtns = shadow.querySelectorAll('.ws-fmt-btn')
      formatBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          formatBtns.forEach(b => b.classList.remove('active'))
          const target = e.currentTarget as HTMLElement
          target.classList.add('active')

          this.selectedFormat = target.getAttribute('data-fmt') || 'pdf'

          // const badge = $('ws-engine-badge')
          // if (badge) {
          //   badge.style.display = this.selectedFormat === 'pdf' ? 'flex' : 'none'
          // }
        })
      })
      $('btn-selection-mode')?.addEventListener('click', () => this.open())
      $('ws-btn-close')?.addEventListener('click', () => this.close())
      $('workspace-overlay')?.addEventListener('click', () => this.close())


      $('ws-btn-select-all')?.addEventListener('click', () => {
        this.cachedMessages.forEach(msg => this.selectedItems.add(msg))
        this.reRenderList()
      })


      $('ws-btn-invert')?.addEventListener('click', () => {
        const newSet = new Set<ChatMessage>()
        this.cachedMessages.forEach(msg => {
          if (!this.selectedItems.has(msg)) newSet.add(msg)
        })
        this.selectedItems = newSet
        this.reRenderList()
      })


      $('ws-btn-select-ai')?.addEventListener('click', () => {
        this.selectedItems.clear()
        this.cachedMessages.forEach(msg => {
          if (msg.role === 'ai') this.selectedItems.add(msg)
        })
        this.reRenderList()
      })

      $('ws-btn-export')?.addEventListener('click', async () => {
        if (this.selectedItems.size === 0) return addLog("log_select_message")

        const dataToExport = this.cachedMessages.filter(msg => this.selectedItems.has(msg))
        addLog('log_export_message')
        this.close()

        try {

          switch (this.selectedFormat) {

            case 'pdf':
              if (exportConfig.pdfEngine === 'native') {
                await generatePDFNative(dataToExport, exportConfig, addLog)
              } else {
                await generatePDFMarkdown(dataToExport, exportConfig, addLog)
              }
              break
            case 'md':
              await generateMarkdown(dataToExport, exportConfig, addLog)
              break
            case 'json':
              await generateJSON(dataToExport, exportConfig, addLog)
              break
            case 'txt':
              await generateTXT(dataToExport, exportConfig, addLog)
              break
            case 'docx':
              await generateWord(dataToExport, exportConfig, addLog)
              break
            case 'img':
              await generateImage(dataToExport, exportConfig, addLog)
              break
          }
        } catch (err) {
          addLog('log_error_message', String(err))
        }
      })
    },

    async open() {
      const adapter = getActiveAdapter()
      if (!adapter) return addLog('log_unsupported_message')


      let { data } = await adapter.extractHistory(exportConfig.enableIncremental)
      if (exportConfig.excludeUserMessages) data = data.filter(m => m.role === 'ai')
      if (data.length === 0) return addLog('log_empty_message')

      this.cachedMessages = data
      this.selectedItems = new Set(data)
      this.selectedFormat = 'pdf'
      shadow.querySelectorAll('.ws-fmt-btn').forEach(b => b.classList.remove('active'))
      shadow.querySelector('.ws-fmt-btn[data-fmt="pdf"]')?.classList.add('active')

      // const badge = $('ws-engine-badge')
      // if (badge) badge.innerText = `CurrentEngine: ${exportConfig.pdfEngine === 'native' ? '💎 Native' : '🚀 Html2Pdf'}`

      this.reRenderList()
      $('omni-workspace').style.display = 'flex'
      $('sidebar').classList.remove('open')
    },

    close() {
      $('omni-workspace').style.display = 'none'
      this.cachedMessages = []
      this.selectedItems.clear()
      this.draggedItem = null
    },

    reRenderList() {
      const listContainer = $('workspace-list')
      listContainer.innerHTML = ''

      this.cachedMessages.forEach((msg) => {
        const isSelected = this.selectedItems.has(msg)
        const card = document.createElement('div')
        card.className = `ws-msg-card ${isSelected ? 'selected' : ''}`
        card.draggable = true

        const roleText = msg.role === 'user' ? 'YOU' : 'AI'

        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = msg.html
        let previewText = tempDiv.textContent || tempDiv.innerText || '...'
        previewText = previewText.replace(/\s+/g, ' ').trim()
        if (previewText.length > 250) previewText = previewText.substring(0, 250) + '...'

        card.innerHTML = `
          <div class="ws-drag-handle" title="Drag to Reorder">≡</div>
          <div><input type="checkbox" ${isSelected ? 'checked' : ''}></div>
          <div style="flex: 1 overflow: hidden">
            <div class="ws-role-badge ${msg.role}">${roleText}</div>
            <div class="ws-msg-html" style="margin-top: 8px white-space: pre-wrap font-family: inherit">
              ${previewText}
            </div>
          </div>
        `


        card.addEventListener('click', (e) => {

          if ((e.target as HTMLElement).closest('.ws-drag-handle')) return

          if (this.selectedItems.has(msg)) this.selectedItems.delete(msg)
          else this.selectedItems.add(msg)
          this.reRenderList()
        })


        card.addEventListener('dragstart', (e) => {
          this.draggedItem = msg
          card.classList.add('dragging')
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', '')
          }
        })

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging')
          this.draggedItem = null

          shadow.querySelectorAll('.ws-msg-card').forEach(c => c.classList.remove('drag-over'))
        })

        card.addEventListener('dragover', (e) => {
          e.preventDefault()
          if (this.draggedItem === msg) return
          card.classList.add('drag-over')
        })

        card.addEventListener('dragleave', () => {
          card.classList.remove('drag-over')
        })

        card.addEventListener('drop', (e) => {
          e.preventDefault()
          card.classList.remove('drag-over')

          if (!this.draggedItem || this.draggedItem === msg) return


          const fromIndex = this.cachedMessages.indexOf(this.draggedItem)
          const toIndex = this.cachedMessages.indexOf(msg)


          this.cachedMessages.splice(fromIndex, 1)

          this.cachedMessages.splice(toIndex, 0, this.draggedItem)


          this.reRenderList()
        })

        listContainer.appendChild(card)
      })

      const countEl = $('ws-sel-count')
      if (countEl) countEl.innerText = this.selectedItems.size.toString()
    }
  }
  WorkspaceManager.init()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOmniUI)
} else {
  initOmniUI()
}