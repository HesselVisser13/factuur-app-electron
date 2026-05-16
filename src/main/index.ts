// src/main/index.ts
import { app, BrowserWindow, dialog, Menu, net, protocol } from 'electron'
import { basename, join } from 'path'
import { pathToFileURL } from 'url'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'

import { runMigrations } from './db/migrate'
import { registerAppHandlers } from './ipc/app.ipc'
import { registerBackupHandlers } from './ipc/backup.ipc'
import { registerBtwAangifteHandlers } from './ipc/btw-aangifte.ipc'
import { registerBtwTarievenHandlers } from './ipc/btw-tarieven.ipc'
import { registerDashboardHandlers } from './ipc/dashboard.ipc'
import { registerFactuurHandlers } from './ipc/facturen.ipc'
import { registerFotosHandlers } from './ipc/fotos.ipc'
import { registerInstellingenHandlers } from './ipc/instellingen.ipc'
import { registerKlantenHandlers } from './ipc/klanten.ipc'
import { registerMailIpc } from './ipc/mail.ipc'
import { registerTransactieHandlers } from './ipc/transacties.ipc'
import { initLogger, log } from './logger'
import { getFacturenDir, getKlantFotosDir, getKlantFotoThumbsDir, getLogosDir } from './paths'
import { applyPendingRestore } from './services/backup/restore.service'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-logo',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  },
  {
    scheme: 'app-pdf',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  },
  {
    scheme: 'app-foto',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'BTW App',
    icon: join(__dirname, '../../build/icon.png'),
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

app.whenReady().then(async () => {
  initLogger()
  electronApp.setAppUserModelId('nl.factuurapp.btw')

  // ============================================================
  // KRITIEK: pending restore VÓÓR Prisma init en migrations
  // De database mag nog niet geopend zijn als we files vervangen.
  // ============================================================
  try {
    const restored = await applyPendingRestore()
    if (restored) {
      log.info('[startup] Backup hersteld bij start')
    }
  } catch (err) {
    log.error('[startup] Pending restore faalde', err)
    dialog.showErrorBox(
      'Backup terugzetten mislukt',
      err instanceof Error ? err.message : 'Onbekende fout'
    )
  }

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

  protocol.handle('app-logo', async (request) => {
    const url = new URL(request.url)
    const requested = decodeURIComponent(url.hostname + url.pathname)
    const safeName = basename(requested)
    const filePath = join(getLogosDir(), safeName)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  protocol.handle('app-pdf', async (request) => {
    const url = new URL(request.url)
    const requested = decodeURIComponent(url.hostname + url.pathname)
    const safeName = basename(requested)
    const filePath = join(getFacturenDir(), safeName)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  protocol.handle('app-foto', async (request) => {
    const url = new URL(request.url)
    const hostMatch = url.hostname.match(/^klant-(\d+)$/)
    if (!hostMatch) {
      return new Response('Invalid klant', { status: 400 })
    }
    const klantId = parseInt(hostMatch[1], 10)
    const requested = decodeURIComponent(url.pathname).replace(/^\/+/, '')

    const isThumb = requested.startsWith('.thumbs/')
    const safeName = basename(isThumb ? requested.replace('.thumbs/', '') : requested)

    const filePath = isThumb
      ? join(getKlantFotoThumbsDir(klantId), safeName)
      : join(getKlantFotosDir(klantId), safeName)

    return net.fetch(pathToFileURL(filePath).toString())
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    log.info('[startup] runMigrations starten...')
    runMigrations()
    log.info('[startup] runMigrations voltooid')
  } catch (error) {
    log.error('[Migration] Failed, app will continue:', error)
  }

  registerTransactieHandlers()
  registerBtwAangifteHandlers()
  registerBtwTarievenHandlers()
  registerInstellingenHandlers()
  registerAppHandlers()
  registerKlantenHandlers()
  registerFactuurHandlers()
  registerDashboardHandlers()
  registerMailIpc()
  registerFotosHandlers()
  registerBackupHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

Menu.setApplicationMenu(null)
