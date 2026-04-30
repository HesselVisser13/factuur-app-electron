// src/main/ipc/transacties.ipc.ts

import { ipcMain } from 'electron'
import { getDatabase } from '../db/client'

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function berekenBedragen(bedrag: number, invoerwijze: string, btwPercentage: number) {
  const factor = btwPercentage / 100

  if (invoerwijze === 'exclusief') {
    const bedragExcl = bedrag
    const btwBedrag = round(bedragExcl * factor)
    return { bedragExcl, btwBedrag, bedragIncl: bedragExcl + btwBedrag }
  } else {
    const bedragIncl = bedrag
    const bedragExcl = round(bedragIncl / (1 + factor))
    const btwBedrag = round(bedragIncl - bedragExcl)
    return { bedragExcl, btwBedrag, bedragIncl }
  }
}

export function registerTransactieHandlers() {
  ipcMain.handle('transacties:getByPeriode', async (_event, van: string, tot: string) => {
    const prisma = getDatabase()
    return prisma.transactie.findMany({
      where: {
        datum: { gte: new Date(van), lte: new Date(tot) }
      },
      include: { btwTarief: true },
      orderBy: { datum: 'desc' }
    })
  })

  ipcMain.handle('transacties:create', async (_event, input) => {
    const prisma = getDatabase()
    const { bedragExcl, btwBedrag, bedragIncl } = berekenBedragen(
      input.bedrag,
      input.invoerwijze,
      input.btwPercentage
    )

    return prisma.transactie.create({
      data: {
        ...input,
        datum: new Date(input.datum),
        bedragExcl,
        btwBedrag,
        bedragIncl
      },
      include: { btwTarief: true }
    })
  })

  ipcMain.handle('transacties:delete', async (_event, id: number) => {
    const prisma = getDatabase()
    return prisma.transactie.delete({ where: { id } })
  })
}
