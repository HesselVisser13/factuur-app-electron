// src/main/services/dashboard.service.ts

import type { Prisma } from '../../generated/prisma/client'

import { getDatabase } from '../db/client'
import type { DashboardStats, Factuur } from '../../shared/types'

/** Factuur zoals Prisma 'm teruggeeft met klant + regels included. */
type FactuurWithRelations = Prisma.FactuurGetPayload<{
  include: { klant: true; regels: true }
}>

/** Single regel-row uit Prisma. */
type FactuurRegelRow = FactuurWithRelations['regels'][number]

function serializeFactuur(factuur: FactuurWithRelations): Factuur {
  return {
    ...factuur,
    status: factuur.status as Factuur['status'],
    datum: factuur.datum.toISOString(),
    vervalDatum: factuur.vervalDatum.toISOString(),
    createdAt: factuur.createdAt.toISOString(),
    updatedAt: factuur.updatedAt.toISOString(),
    klant: {
      ...factuur.klant,
      type: factuur.klant.type as 'particulier' | 'zakelijk',
      createdAt: factuur.klant.createdAt.toISOString(),
      updatedAt: factuur.klant.updatedAt.toISOString()
    },
    regels: (factuur.regels || [])
      .sort((a: FactuurRegelRow, b: FactuurRegelRow) => a.volgorde - b.volgorde)
      .map((r: FactuurRegelRow) => ({ ...r, datum: r.datum.toISOString() }))
  }
}

function getKwartaalRange(date: Date): { van: Date; tot: Date } {
  const kwartaal = Math.floor(date.getMonth() / 3)
  const jaar = date.getFullYear()
  const van = new Date(jaar, kwartaal * 3, 1)
  const tot = new Date(jaar, kwartaal * 3 + 3, 0, 23, 59, 59, 999)
  return { van, tot }
}

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const prisma = getDatabase()
    const nu = new Date()
    const { van, tot } = getKwartaalRange(nu)

    const openstaandeFacturen = await prisma.factuur.findMany({
      where: { status: 'verstuurd' }
    })

    const vervallenFacturen = openstaandeFacturen.filter((f) => f.vervalDatum < nu)

    const ditKwartaalFacturen = await prisma.factuur.findMany({
      where: {
        datum: { gte: van, lte: tot },
        status: { not: 'geannuleerd' }
      }
    })

    const laatsteFacturenRaw = await prisma.factuur.findMany({
      where: { status: { not: 'geannuleerd' } },
      orderBy: { datum: 'desc' },
      take: 5,
      include: { klant: true, regels: true }
    })

    return {
      openstaand: {
        aantal: openstaandeFacturen.length,
        bedrag: {
          incl: openstaandeFacturen.reduce((sum, f) => sum + f.totaalIncl, 0),
          excl: openstaandeFacturen.reduce((sum, f) => sum + f.totaalExcl, 0)
        }
      },
      vervallen: {
        aantal: vervallenFacturen.length,
        bedrag: {
          incl: vervallenFacturen.reduce((sum, f) => sum + f.totaalIncl, 0),
          excl: vervallenFacturen.reduce((sum, f) => sum + f.totaalExcl, 0)
        }
      },
      ditKwartaal: {
        aantal: ditKwartaalFacturen.length,
        bedrag: {
          incl: ditKwartaalFacturen.reduce((sum, f) => sum + f.totaalIncl, 0),
          excl: ditKwartaalFacturen.reduce((sum, f) => sum + f.totaalExcl, 0)
        }
      },
      laatsteFacturen: laatsteFacturenRaw.map(serializeFactuur)
    }
  }
}

export const dashboardService = new DashboardService()
