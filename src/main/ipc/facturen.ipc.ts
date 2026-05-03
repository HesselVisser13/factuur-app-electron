// src/main/ipc/facturen.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { facturenService } from '../services/facturen.service'
import {
  FactuurInputSchema,
  FactuurUpdateSchema,
  FactuurStatusUpdateSchema
} from '../../shared/schemas'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { z } from 'zod'
import { dialog, shell } from 'electron'
import { pdfService } from '../services/pdf.service'
import { getFacturenDir } from '../paths'
import { existsSync, copyFileSync } from 'node:fs'

export function registerFactuurHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_GET_ALL,
    createHandler(async () => {
      return facturenService.getAll()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_GET_BY_ID,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      return facturenService.getById(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_CREATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(FactuurInputSchema, data)
      return facturenService.create(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_UPDATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(FactuurUpdateSchema, data)
      return facturenService.update(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_DELETE,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      await facturenService.delete(validated)
      return true
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_UPDATE_STATUS,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(FactuurStatusUpdateSchema, data)
      return facturenService.updateStatus(validated.id, validated.status)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_GET_NEXT_NUMMER,
    createHandler(async (_event, datum: unknown) => {
      const validated = validate(z.string().optional(), datum)
      return facturenService.getNextNummer(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_GENEREER_PDF,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      return pdfService.genereerFactuurPdf(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_OPSLAAN_PDF_ALS,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)

      // Eerst zorgen dat PDF bestaat
      const { filePath, factuurNummer } = await pdfService.genereerFactuurPdf(validated)

      // Dialog tonen
      const result = await dialog.showSaveDialog({
        title: 'Factuur opslaan als...',
        defaultPath: `Factuur-${factuurNummer}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })

      if (result.canceled || !result.filePath) {
        return { saved: false, filePath: null }
      }

      copyFileSync(filePath, result.filePath)
      return { saved: true, filePath: result.filePath }
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_OPEN_PDF,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      const { filePath } = await pdfService.genereerFactuurPdf(validated)

      if (!existsSync(filePath)) {
        throw new Error('PDF niet gevonden')
      }

      const err = await shell.openPath(filePath)
      if (err) throw new Error(err)

      return { filePath }
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FACTUREN_OPEN_PDF_FOLDER,
    createHandler(async () => {
      const dir = getFacturenDir()
      await shell.openPath(dir)
      return { folder: dir }
    })
  )
}
