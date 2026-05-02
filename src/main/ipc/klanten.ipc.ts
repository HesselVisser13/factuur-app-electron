import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { klantenService } from '../services/klanten.service'
import { KlantInputSchema, KlantUpdateSchema } from '../../shared/schemas'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { z } from 'zod'

export function registerKlantenHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.KLANTEN_GET_ALL,
    createHandler(async () => {
      return klantenService.getAll()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.KLANTEN_CREATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(KlantInputSchema, data)
      return klantenService.create(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.KLANTEN_UPDATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(KlantUpdateSchema, data)
      return klantenService.update(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.KLANTEN_DELETE,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      await klantenService.delete(validated)
      return true
    })
  )
}
