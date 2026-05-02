// src/main/ipc/instellingen.ipc.ts

import { ipcMain } from 'electron'
import { getDatabase } from '../db/client'

export function registerInstellingenHandlers() {
  ipcMain.handle('instellingen:getAll', async () => {
    const prisma = getDatabase()
    const instellingen = await prisma.instelling.findMany()

    // Omzetten naar key-value object
    const result: Record<string, string> = {}
    for (const instelling of instellingen) {
      result[instelling.key] = instelling.value
    }
    return result
  })

  ipcMain.handle('instellingen:save', async (_event, data: Record<string, string>) => {
    const prisma = getDatabase()

    for (const [key, value] of Object.entries(data)) {
      await prisma.instelling.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }

    return true
  })
}
