// src/main/ipc/instellingen.ipc.ts

import { ipcMain, dialog, app } from 'electron'
import { createHandler, validate } from './helpers'
import { instellingenService } from '../services/instellingen.service'
import { InstellingenSchema } from '../../shared/schemas'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { join, extname, basename } from 'path'
import { mkdirSync, copyFileSync, existsSync } from 'fs'

export function registerInstellingenHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.INSTELLINGEN_GET_ALL,
    createHandler(async () => {
      return instellingenService.getAll()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.INSTELLINGEN_SAVE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(InstellingenSchema, data)
      await instellingenService.save(validated)
      return true
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.INSTELLINGEN_SELECT_LOGO,
    createHandler(async () => {
      const result = await dialog.showOpenDialog({
        title: 'Kies een logo',
        properties: ['openFile'],
        filters: [{ name: 'Afbeeldingen', extensions: ['png', 'jpg', 'jpeg'] }]
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      const sourcePath = result.filePaths[0]
      const logosDir = join(app.getPath('userData'), 'logos')

      if (!existsSync(logosDir)) {
        mkdirSync(logosDir, { recursive: true })
      }

      const ext = extname(sourcePath).toLowerCase()
      const fileName = `logo_${Date.now()}${ext}`
      const targetPath = join(logosDir, fileName)

      copyFileSync(sourcePath, targetPath)

      return { fileName, originalName: basename(sourcePath) }
    })
  )
}
