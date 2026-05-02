// src/main/ipc/btw-tarieven.ipc.ts

import { ipcMain } from 'electron'
import { createHandler } from './helpers'
import { btwTariefService } from '../services/btw-tarief.service'

export function registerBtwTarievenHandlers() {
  ipcMain.handle(
    'btwTarieven:getActief',
    createHandler(async () => {
      return btwTariefService.getActief()
    })
  )
}
