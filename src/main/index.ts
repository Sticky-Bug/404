import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { keyStore } from './security/key-store'
import { gmailService } from './gmail/service'
import { registerIpcHandlers } from './ipc/handlers'

function createWindow(): void {
  // Create the browser window with exact client dimensions
  const mainWindow = new BrowserWindow({
    width: 1023,
    height: 579,
    useContentSize: true,
    title: 'Mail B.I.T',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize application and register secure IPC handlers
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.vibewrite.app')

  // Handle microphone permissions for speech recognition
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback, details) => {
      const permStr = permission as string
      const mediaTypes =
        details && 'mediaTypes' in details
          ? (details as { mediaTypes?: string[] }).mediaTypes
          : undefined
      if (
        permStr === 'media' ||
        permStr === 'microphone' ||
        permStr === 'audio-capture' ||
        permStr === 'mediaKeySystem' ||
        (Array.isArray(mediaTypes) && mediaTypes.includes('audio'))
      ) {
        callback(true)
        return
      }
      callback(false)
    }
  )

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, _origin, details) => {
    const permStr = permission as string
    const mediaTypes =
      details && 'mediaTypes' in details
        ? (details as { mediaTypes?: string[] }).mediaTypes
        : undefined
    if (
      permStr === 'media' ||
      permStr === 'microphone' ||
      permStr === 'audio-capture' ||
      permStr === 'mediaKeySystem' ||
      (Array.isArray(mediaTypes) && mediaTypes.includes('audio'))
    ) {
      return true
    }
    return false
  })

  // Load safeStorage encrypted keys
  keyStore.init()
  gmailService.init()

  // Register Zod-validated IPC handlers for window.vibewrite
  registerIpcHandlers()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
