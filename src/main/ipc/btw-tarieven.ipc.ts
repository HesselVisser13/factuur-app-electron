// src/main/ipc/btw-tarieven.ipc.ts

import { ipcMain } from 'electron'
import { createHandler } from './helpers'
import { btwTariefService } from '../services/btw-tarief.service'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerBtwTarievenHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.BTW_TARIEVEN_GET_ACTIEF,
    createHandler(async () => {
      return btwTariefService.getActief()
    })
  )
}
