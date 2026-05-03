// src/main/services/dashboard.service.ts

import { getDatabase } from '../db/client'
import type { DashboardStats, Factuur } from '../../shared/types'

// Helper: serialize factuur (date → ISO strings)
function serializeFactuur(factuur: any): Factuur {
  return {
    ...factuur,
    status: factuur.status,
    datum: factuur.datum.toISOString(),
    vervalDatum: factuur.vervalDatum.toISOString(),
    createdAt: factuur.createdAt.toISOString(),
    updatedAt: factuur.updatedAt.toISOString(),
    klant: {
      ...factuur.klant,
      type: factuur.klant.type,
      createdAt: factuur.klant.createdAt.toISOString(),
      updatedAt: factuur.klant.updatedAt.toISOString()
    },
    regels: (factuur.regels || [])
      .sort((a: any, b: any) => a.volgorde - b.volgorde)
      .map((r: any) => ({ ...r, datum: r.datum.toISOString() }))
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

    // Alle verstuurde facturen (openstaand)
    const openstaandeFacturen = await prisma.factuur.findMany({
      where: { status: 'verstuurd' }
    })

    // Daarvan: welke zijn vervallen
    const vervallenFacturen = openstaandeFacturen.filter((f) => f.vervalDatum < nu)

    // Dit kwartaal: alle facturen die NIET geannuleerd zijn
    const ditKwartaalFacturen = await prisma.factuur.findMany({
      where: {
        datum: { gte: van, lte: tot },
        status: { not: 'geannuleerd' }
      }
    })

    // Laatste 5 facturen (alle statussen behalve concept)
    const laatsteFacturenRaw = await prisma.factuur.findMany({
      where: { status: { not: 'geannuleerd' } },
      orderBy: { datum: 'desc' },
      take: 5,
      include: { klant: true, regels: true }
    })

    return {
      openstaand: {
        aantal: openstaandeFacturen.length,
        bedrag: openstaandeFacturen.reduce((sum, f) => sum + f.totaalIncl, 0)
      },
      vervallen: {
        aantal: vervallenFacturen.length,
        bedrag: vervallenFacturen.reduce((sum, f) => sum + f.totaalIncl, 0)
      },
      ditKwartaal: {
        aantal: ditKwartaalFacturen.length,
        bedrag: ditKwartaalFacturen.reduce((sum, f) => sum + f.totaalIncl, 0)
      },
      laatsteFacturen: laatsteFacturenRaw.map(serializeFactuur)
    }
  }
}

export const dashboardService = new DashboardService()
