// src/main/ipc/instellingen.ipc.ts

import { existsSync, mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'

import { app, dialog, ipcMain } from 'electron'
import sharp from 'sharp'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { InstellingenSchema } from '../../shared/schemas'
import { log } from '../logger'
import { instellingenService } from '../services/instellingen.service'

import { createHandler, validate } from './helpers'

export function registerInstellingenHandlers(): void {
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

      const fileName = `logo_${Date.now()}.png`
      const targetPath = join(logosDir, fileName)

      try {
        await sharp(sourcePath)
          .trim()
          .resize(1024, 1024, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .png({ quality: 90 })
          .toFile(targetPath)

        log.info(`[logo] Verwerkt: ${fileName} (van ${basename(sourcePath)})`)

        return { fileName, originalName: basename(sourcePath) }
      } catch (err) {
        log.error('[logo] Verwerking mislukt', err)
        throw new Error(
          err instanceof Error ? `Logo verwerken mislukt: ${err.message}` : 'Logo verwerken mislukt'
        )
      }
    })
  )
}
