// src/main/index.ts

import { app, BrowserWindow, protocol, net } from 'electron'
import { join, basename } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerTransactieHandlers } from './ipc/transacties.ipc'
import { registerBtwAangifteHandlers } from './ipc/btw-aangifte.ipc'
import { registerBtwTarievenHandlers } from './ipc/btw-tarieven.ipc'
import { registerInstellingenHandlers } from './ipc/instellingen.ipc'
import { registerAppHandlers } from './ipc/app.ipc'
import { registerKlantenHandlers } from './ipc/klanten.ipc'
import { runMigrations } from './db/migrate'
import { initLogger, log } from './logger'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-logo',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'BTW App',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initLogger()
  electronApp.setAppUserModelId('nl.factuurapp.btw')

  protocol.handle('app-logo', async (request) => {
    const url = new URL(request.url)
    const requested = decodeURIComponent(url.hostname + url.pathname)
    const safeName = basename(requested)
    const filePath = join(app.getPath('userData'), 'logos', safeName)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  runMigrations()

  registerTransactieHandlers()
  registerBtwAangifteHandlers()
  registerBtwTarievenHandlers()
  registerInstellingenHandlers()
  registerAppHandlers()
  registerKlantenHandlers()

  createWindow()

  if (!is.dev) {
    autoUpdater.logger = log
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-downloaded', () => {
      log.info('[AutoUpdater] Update downloaded, will install on quit')
    })

    autoUpdater.on('error', (error) => {
      log.error('[AutoUpdater] Error:', error)
    })

    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
