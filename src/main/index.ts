// src/main/index.ts

import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerTransactieHandlers } from './ipc/transacties.ipc'
import { registerBtwAangifteHandlers } from './ipc/btw-aangifte.ipc'
import { registerBtwTarievenHandlers } from './ipc/btw-tarieven.ipc'
import { registerInstellingenHandlers } from './ipc/instellingen.ipc'
import { registerAppHandlers } from './ipc/app.ipc'
import { runMigrations } from './db/migrate'
import { initLogger, log } from './logger'

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

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  runMigrations()

  registerTransactieHandlers()
  registerBtwAangifteHandlers()
  registerBtwTarievenHandlers()
  registerInstellingenHandlers()
  registerAppHandlers()

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
