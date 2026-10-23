import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Expose narrow VibeWrite bridge matching the exact contract
const vibewriteBridge = {
  getProviderStatus: () => ipcRenderer.invoke('vibewrite:getProviderStatus'),
  generateRewrite: (request: unknown) => ipcRenderer.invoke('vibewrite:generateRewrite', request),
  generateOfflineRewrite: (request: unknown) =>
    ipcRenderer.invoke('vibewrite:generateOfflineRewrite', request),
  setApiKey: (input: unknown) => ipcRenderer.invoke('vibewrite:setApiKey', input),
  clearApiKey: (input: unknown) => ipcRenderer.invoke('vibewrite:clearApiKey', input),
  testProvider: (input: unknown) => ipcRenderer.invoke('vibewrite:testProvider', input)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('vibewrite', vibewriteBridge)
  } catch (error) {
    console.error('Failed to expose preload bridges:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.vibewrite = vibewriteBridge
}
