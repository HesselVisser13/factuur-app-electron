// src/main/ipc/btw-aangifte.ipc.ts

import { ipcMain } from 'electron'
import { getDatabase } from '../db/client'

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function registerBtwAangifteHandlers() {
  ipcMain.handle('btwAangifte:genereer', async (_event, kwartaal: number, jaar: number) => {
    const prisma = getDatabase()

    const startMaand = (kwartaal - 1) * 3
    const van = new Date(jaar, startMaand, 1)
    const tot = new Date(jaar, startMaand + 3, 0, 23, 59, 59)

    const transacties = await prisma.transactie.findMany({
      where: { datum: { gte: van, lte: tot } }
    })

    const perTarief = new Map<
      number,
      {
        tariefNaam: string
        percentage: number
        omzet: number
        verschuldigdeBtw: number
        inkoop: number
        voorbelasting: number
      }
    >()

    for (const t of transacties) {
      if (!perTarief.has(t.btwPercentage)) {
        perTarief.set(t.btwPercentage, {
          tariefNaam: `${t.btwPercentage}%`,
          percentage: t.btwPercentage,
          omzet: 0,
          verschuldigdeBtw: 0,
          inkoop: 0,
          voorbelasting: 0
        })
      }

      const regel = perTarief.get(t.btwPercentage)!

      if (t.type === 'inkomst') {
        regel.omzet += t.bedragExcl
        regel.verschuldigdeBtw += t.btwBedrag
      } else {
        regel.inkoop += t.bedragExcl
        regel.voorbelasting += t.btwBedrag
      }
    }

    const regels = Array.from(perTarief.values())
      .map((r) => ({
        ...r,
        omzet: round(r.omzet),
        verschuldigdeBtw: round(r.verschuldigdeBtw),
        inkoop: round(r.inkoop),
        voorbelasting: round(r.voorbelasting)
      }))
      .sort((a, b) => b.percentage - a.percentage)

    const totaalVerschuldigd = round(regels.reduce((sum, r) => sum + r.verschuldigdeBtw, 0))
    const totaalVoorbelasting = round(regels.reduce((sum, r) => sum + r.voorbelasting, 0))

    return {
      van: van.toISOString(),
      tot: tot.toISOString(),
      regels,
      totaalVerschuldigd,
      totaalVoorbelasting,
      afTeDragen: round(totaalVerschuldigd - totaalVoorbelasting)
    }
  })
}
