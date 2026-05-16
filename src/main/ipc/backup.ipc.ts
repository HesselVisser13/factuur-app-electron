// src/main/ipc/backup.ipc.ts

import { app, dialog, ipcMain } from 'electron'
import { z } from 'zod'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { log } from '../logger'
import { createBackup, suggestBackupFilename } from '../services/backup/backup.service'
import { inspectBackup, prepareRestore } from '../services/backup/restore.service'

import { createHandler, validate } from './helpers'
import {
  getEffectiveBackupFolder,
  getDefaultBackupFolder,
  readConfig,
  resetFailureCounter
} from '../services/backup/auto-backup-config'
import {
  getLastAutoBackupTime,
  getLastBackupTime,
  runAutoBackupForced
} from '../services/backup/auto-backup.service'

export function registerBackupHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_PICK_SAVE_LOCATION,
    createHandler(async () => {
      const result = await dialog.showSaveDialog({
        title: 'Backup opslaan als...',
        defaultPath: suggestBackupFilename(),
        filters: [{ name: 'BTW App Backup', extensions: ['zip'] }]
      })
      if (result.canceled || !result.filePath) return null
      return result.filePath
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_PICK_OPEN_LOCATION,
    createHandler(async () => {
      const result = await dialog.showOpenDialog({
        title: 'Backup-bestand kiezen',
        properties: ['openFile'],
        filters: [{ name: 'BTW App Backup', extensions: ['zip'] }]
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_CREATE,
    createHandler(async (_event, targetPath: unknown) => {
      const validated = validate(z.string().min(1), targetPath)
      return createBackup(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_INSPECT,
    createHandler(async (_event, zipPath: unknown) => {
      const validated = validate(z.string().min(1), zipPath)
      return inspectBackup(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_RESTORE,
    createHandler(async (_event, zipPath: unknown) => {
      const validated = validate(z.string().min(1), zipPath)
      // Bereidt restore voor (extract naar staging + marker)
      // Daadwerkelijke swap gebeurt op VOLGENDE app-start
      return prepareRestore(validated)
    })
  )

  log.info('[backup-ipc] Backup handlers geregistreerd')

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_GET_AUTO_STATUS,
    createHandler(async () => {
      const config = await readConfig()
      const lastAuto = await getLastAutoBackupTime()
      const lastAny = await getLastBackupTime()

      return {
        enabled: config.enabled,
        folder: config.folder.trim() || getDefaultBackupFolder(),
        isCustomFolder: config.folder.trim() !== '',
        consecutiveFailures: config.consecutiveFailures,
        lastAutoBackupAt: lastAuto?.toISOString() ?? null,
        lastBackupAt: lastAny?.toISOString() ?? null
      }
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_RUN_AUTO_NOW,
    createHandler(async () => {
      await resetFailureCounter()
      return runAutoBackupForced()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_PICK_FOLDER,
    createHandler(async () => {
      const result = await dialog.showOpenDialog({
        title: 'Kies folder voor automatische backups',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: await getEffectiveBackupFolder()
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    })
  )

  log.info('[backup-ipc] Auto-backup handlers geregistreerd')
}

// Helper-IPC die de app herstart
ipcMain.on('backup:relaunch', () => {
  log.info('[backup-ipc] App herstarten')
  app.relaunch()
  app.exit(0)
})
