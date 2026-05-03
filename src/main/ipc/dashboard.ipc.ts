// src/main/ipc/dashboard.ipc.ts

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { dashboardService } from '../services/dashboard.service'
import { createHandler } from './helpers'

export function registerDashboardHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.DASHBOARD_GET_STATS,
    createHandler(async () => {
      return dashboardService.getStats()
    })
  )
}
