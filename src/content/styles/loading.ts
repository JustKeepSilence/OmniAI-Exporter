const LOADING_HINTS = [
  "Exporting... Please do not close this page",
]

let loadingInterval: any = null

const getOmniElement = (id: string): HTMLElement | null => {
  let el = document.getElementById(id)
  if (el) return el

  const allElements = document.querySelectorAll('*')
  for (const host of allElements) {
    if (host.shadowRoot) {
      const found = host.shadowRoot.getElementById(id)
      if (found) return found as HTMLElement
    }
  }

  const sidebar = document.querySelector('.omni-sidebar') || document.querySelector('[class*="omni-"]')
  if (sidebar && sidebar.getRootNode() instanceof ShadowRoot) {
    return (sidebar.getRootNode() as ShadowRoot).getElementById(id) as HTMLElement
  }

  return null
}

export const showGlobalLoading = () => {
  const overlay = getOmniElement('omni-global-loading')
  const textEl = getOmniElement('loading-dynamic-text')

  if (!overlay || !textEl) {
    // const hosts = Array.from(document.querySelectorAll('*')).filter(e => e.shadowRoot)
    return
  }

  overlay.style.setProperty('display', 'flex', 'important')
  overlay.style.setProperty('z-index', '2147483647', 'important')
  
  let index = 0
  textEl.innerText = LOADING_HINTS[0]
  
  if (loadingInterval) clearInterval(loadingInterval)
  loadingInterval = setInterval(() => {
    index = (index + 1) % LOADING_HINTS.length
    textEl.innerText = LOADING_HINTS[index]
  }, 2500)
}

export const hideGlobalLoading = () => {
  const overlay = getOmniElement('omni-global-loading')
  if (overlay) {
    overlay.style.setProperty('display', 'none', 'important')
  }
  
  if (loadingInterval) {
    clearInterval(loadingInterval)
    loadingInterval = null
  }
}