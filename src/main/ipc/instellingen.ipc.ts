// src/main/ipc/instellingen.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { instellingenService } from '../services/instellingen.service'
import { InstellingenSchema } from '../../shared/schemas'

export function registerInstellingenHandlers() {
  ipcMain.handle(
    'instellingen:getAll',
    createHandler(async () => {
      return instellingenService.getAll()
    })
  )

  ipcMain.handle(
    'instellingen:save',
    createHandler(async (_event, data: unknown) => {
      const validated = validate(InstellingenSchema, data)
      await instellingenService.save(validated)
      return true
    })
  )
}
