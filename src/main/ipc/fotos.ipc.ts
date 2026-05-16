// src/main/ipc/fotos.ipc.ts

import { dialog, ipcMain, shell } from 'electron'
import { z } from 'zod'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getDatabase } from '../db/client'
import { log } from '../logger'
import { getKlantFotoPath } from '../paths'
import { fotosService } from '../services/fotos.service'

import { createHandler, validate } from './helpers'

export function registerFotosHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.FOTOS_LIST_BY_KLANT,
    createHandler(async (_event, klantId: unknown) => {
      const id = validate(z.number().int().positive(), klantId)
      return fotosService.listByKlant(id)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FOTOS_PICK_FILES,
    createHandler(async () => {
      const result = await dialog.showOpenDialog({
        title: "Selecteer foto's",
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: "Foto's",
            extensions: ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp']
          }
        ]
      })
      if (result.canceled) return []
      return result.filePaths
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FOTOS_ADD,
    createHandler(async (_event, data: unknown) => {
      const schema = z.object({
        klantId: z.number().int().positive(),
        sourcePath: z.string().min(1),
        originalName: z.string().min(1).max(255)
      })
      const validated = validate(schema, data)
      return fotosService.add(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FOTOS_UPDATE_NOTITIE,
    createHandler(async (_event, data: unknown) => {
      const schema = z.object({
        id: z.number().int().positive(),
        notitie: z.string().nullable()
      })
      const validated = validate(schema, data)
      return fotosService.updateNotitie(validated.id, validated.notitie)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FOTOS_DELETE,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      await fotosService.delete(validated)
      return true
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.FOTOS_OPEN_EXTERNAL,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      const prisma = getDatabase()
      const foto = await prisma.foto.findUniqueOrThrow({ where: { id: validated } })
      const path = getKlantFotoPath(foto.klantId, foto.filename)
      const error = await shell.openPath(path)
      if (error) {
        throw new Error(`Foto kon niet geopend worden: ${error}`)
      }
      return true
    })
  )

  log.info('[fotos-ipc] Foto IPC handlers geregistreerd')
}
