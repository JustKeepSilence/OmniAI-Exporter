export const generateHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 
  }
  return hash.toString(36)
}

export const getExportedMemory = async (dialogueId: string): Promise<Set<string>> => {
  const key = `omni_memory_${dialogueId}`
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(new Set((result[key] as string[]) || []))
    })
  })
}

export const saveExportedMemory = async (dialogueId: string, newHashes: string[]) => {
  const key = `omni_memory_${dialogueId}`
  const existingSet = await getExportedMemory(dialogueId)
  
  newHashes.forEach(h => existingSet.add(h))
  
  return new Promise<void>((resolve) => {
    chrome.storage.local.set({ [key]: Array.from(existingSet) }, () => {
      resolve()
    })
  })
}

export const clearExportedMemory = async (dialogueId: string): Promise<void> => {
  const key = `omni_memory_${dialogueId}`
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove([key], () => resolve())
    } else {
      localStorage.removeItem(key)
      resolve()
    }
  })
}

export const saveIncrementalToggleState = async (isEnabled: boolean): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'omni_cfg_incremental_state': isEnabled }, () => resolve())
    } else {
      localStorage.setItem('omni_cfg_incremental_state', String(isEnabled))
      resolve()
    }
  })
}

export const getIncrementalToggleState = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['omni_cfg_incremental_state'], (result) => {
        resolve(result['omni_cfg_incremental_state'] === true)
      })
    } else {
      const state = localStorage.getItem('omni_cfg_incremental_state')
      resolve(state === 'true')
    }
  })
}