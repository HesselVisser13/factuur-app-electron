// src/main/ipc/btw-tarieven.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { btwTariefService } from '../services/btw-tarief.service'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { z } from 'zod'
import { BtwTariefInputSchema, BtwTariefUpdateSchema } from '../../shared/schemas'

export function registerBtwTarievenHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.BTW_TARIEVEN_GET_ACTIEF,
    createHandler(async () => {
      return btwTariefService.getActief()
    })
  )
  ipcMain.handle(
    IPC_CHANNELS.BTW_TARIEVEN_CREATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(BtwTariefInputSchema, data)
      return btwTariefService.create(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BTW_TARIEVEN_UPDATE,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(BtwTariefUpdateSchema, data)
      return btwTariefService.update(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BTW_TARIEVEN_DELETE,
    createHandler(async (_event, id: unknown) => {
      const validated = validate(z.number().int().positive(), id)
      await btwTariefService.delete(validated)
      return true
    })
  )
}
