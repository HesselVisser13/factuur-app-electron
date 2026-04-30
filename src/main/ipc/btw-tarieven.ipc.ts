// src/main/ipc/btw-tarieven.ipc.ts

import { ipcMain } from 'electron'
import { getDatabase } from '../db/client'

export function registerBtwTarievenHandlers() {
  ipcMain.handle('btwTarieven:getActief', async () => {
    const prisma = getDatabase()
    return prisma.btwTarief.findMany({
      where: { geldigTot: null },
      orderBy: { percentage: 'desc' }
    })
  })
}
