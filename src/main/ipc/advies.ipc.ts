// src/main/ipc/advies.ipc.ts

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { adviesService } from '../services/advies.service'

export function registerAdviesIpc(): void {
  ipcMain.handle(IPC_CHANNELS.ADVIES_GET_ALL, async (_event, jaar: number) => {
    return adviesService.getAdviezen(jaar)
  })
}
