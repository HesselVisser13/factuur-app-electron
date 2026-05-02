// src/main/ipc/instellingen.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { instellingenService } from '../services/instellingen.service'
import { InstellingenSchema } from '../../shared/schemas'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

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
}
