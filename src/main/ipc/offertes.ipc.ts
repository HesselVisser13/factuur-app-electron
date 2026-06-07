// src/main/ipc/offertes.ipc.ts

import { existsSync } from 'node:fs'

import { dialog, ipcMain, shell } from 'electron'
import { z } from 'zod'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { OfferteInputSchema, OfferteStatusSchema, OfferteUpdateSchema } from '../../shared/schemas'
import { log } from '../logger'
import { getOffertesDir } from '../paths'
import { offertePdfService } from '../services/offerte-pdf.service'
import { offertesService } from '../services/offertes.service'

import { createHandler, validate } from './helpers'

export function registerOffertesHandlers(): void {
  // ============================================================
  // CRUD
  // ============================================================

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_GET_ALL,
    createHandler(async () => {
      return offertesService.getAll()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_GET_BY_ID,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      return offertesService.getById(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_GET_NEXT_NUMMER,
    createHandler(async (_event, datum: unknown) => {
      const validated = datum === undefined ? undefined : validate(z.string(), datum)
      return offertesService.getNextNummer(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_CREATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(OfferteInputSchema, data)
      return offertesService.create(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_UPDATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(OfferteUpdateSchema, data)
      return offertesService.update(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_UPDATE_STATUS,
    createHandler(async (_event, data: unknown) => {
      const schema = z.object({
        id: z.number().int().positive(),
        status: OfferteStatusSchema
      })
      const validated = validate(schema, data)
      return offertesService.updateStatus(validated.id, validated.status)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_DELETE,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      await offertesService.delete(validated)
      return true
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_CONVERTEER_NAAR_FACTUUR,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      return offertesService.converteerNaarFactuur(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_MARKEER_VERLOPEN,
    createHandler(async () => {
      return offertesService.markeerVerlopen()
    })
  )

  // ============================================================
  // PDF
  // ============================================================

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_GENEREER_PDF,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      return offertePdfService.genereerOffertePdf(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_OPEN_PDF,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      const result = await offertePdfService.genereerOffertePdf(validated)
      await shell.openPath(result.filePath)
      return result
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_PDF_BUFFER,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      const buffer = await offertePdfService.genereerOffertePdfBuffer(validated)
      return buffer.toString('base64')
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_GENEREER_HTML,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      return offertePdfService.genereerOfferteHtml(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_OPSLAAN_PDF_ALS,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)

      const offerte = await offertesService.getById(validated)
      const result = await dialog.showSaveDialog({
        title: 'Offerte opslaan als',
        defaultPath: `${offerte.offerteNummer}.pdf`,
        filters: [{ name: 'PDF-bestanden', extensions: ['pdf'] }]
      })

      if (result.canceled || !result.filePath) {
        return { saved: false }
      }

      const buffer = await offertePdfService.genereerOffertePdfBuffer(validated)
      const fs = await import('node:fs')
      fs.writeFileSync(result.filePath, buffer)

      return { saved: true, filePath: result.filePath }
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.OFFERTES_OPEN_FOLDER,
    createHandler(async () => {
      const dir = getOffertesDir()
      if (!existsSync(dir)) {
        return { opened: false }
      }
      await shell.openPath(dir)
      return { opened: true }
    })
  )

  log.info('[offertes-ipc] Offertes handlers geregistreerd')
}
