// src/main/ipc/app.ipc.ts

import { ipcMain, app } from 'electron'
import { createHandler } from './helpers'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerAppHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.APP_GET_VERSION,
    createHandler(async () => {
      return app.getVersion()
    })
  )
}
