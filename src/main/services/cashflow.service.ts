// src/main/services/cashflow.service.ts

import {
  CATEGORIEEN,
  OMZET_STATUSSEN,
  ONTVANGEN_STATUSSEN,
  OPENSTAAND_STATUSSEN
} from '../../shared/constants'
import type {
  CashflowKpis,
  CashflowOverview,
  CashflowPeriod,
  CategorieData,
  KlantOmzetData,
  MaandData
} from '../../shared/types'
import { getDatabase } from '../db/client'
import { log } from '../logger'

interface FactuurAgg {
  id: number
  totaalIncl: number
  status: string
  klantId: number
  datum: Date
  klant: {
    id: number
    type: string
    bedrijfsnaam: string | null
    voornaam: string | null
    achternaam: string | null
  }
}

interface TransactieAgg {
  bedragIncl: number
  type: string
  datum: Date
  categorie: string | null
}

/** Convert euro (DB) naar cents (transport). Round-safe. */
function toCents(euro: number): number {
  return Math.round(euro * 100 + Number.EPSILON * Math.abs(euro * 100))
}

export class CashflowService {
  async getOverview(period: CashflowPeriod): Promise<CashflowOverview> {
    const van = new Date(period.van)
    const tot = new Date(period.tot)
    tot.setHours(23, 59, 59, 999)

    log.info(`[cashflow] Overview ophalen voor ${period.van} t/m ${period.tot}`)

    const prisma = getDatabase()

    const [facturen, transacties] = await Promise.all([
      prisma.factuur.findMany({
        where: { datum: { gte: van, lte: tot } },
        include: {
          klant: {
            select: {
              id: true,
              type: true,
              bedrijfsnaam: true,
              voornaam: true,
              achternaam: true
            }
          }
        }
      }),
      prisma.transactie.findMany({
        where: { datum: { gte: van, lte: tot } }
      })
    ])

    const kpis = this.berekenKpis(facturen, transacties)
    const perMaand = this.berekenMaandData(facturen, transacties, van, tot)
    const uitgavenPerCategorie = this.berekenCategorieBreakdown(transacties)
    const topKlanten = this.berekenTopKlanten(facturen)

    return { kpis, perMaand, uitgavenPerCategorie, topKlanten }
  }

  // ============================================================
  // KPI's (alle bedragen in cents)
  // ============================================================

  private berekenKpis(facturen: FactuurAgg[], transacties: TransactieAgg[]): CashflowKpis {
    let gefactureerdCents = 0
    let ontvangenCents = 0
    let openstaandCents = 0
    let aantalFacturen = 0

    for (const f of facturen) {
      const totaalCents = toCents(f.totaalIncl)
      if (OMZET_STATUSSEN.includes(f.status as (typeof OMZET_STATUSSEN)[number])) {
        gefactureerdCents += totaalCents
        aantalFacturen++
      }
      if (ONTVANGEN_STATUSSEN.includes(f.status as (typeof ONTVANGEN_STATUSSEN)[number])) {
        ontvangenCents += totaalCents
      }
      if (OPENSTAAND_STATUSSEN.includes(f.status as (typeof OPENSTAAND_STATUSSEN)[number])) {
        openstaandCents += totaalCents
      }
    }

    let uitgavenCents = 0
    let aantalTransacties = 0
    for (const t of transacties) {
      if (t.type === 'uitgave') {
        uitgavenCents += toCents(t.bedragIncl)
        aantalTransacties++
      }
    }

    return {
      gefactureerd: gefactureerdCents,
      ontvangen: ontvangenCents,
      openstaand: openstaandCents,
      uitgaven: uitgavenCents,
      resultaat: gefactureerdCents - uitgavenCents,
      aantalFacturen,
      aantalTransacties
    }
  }

  // ============================================================
  // Maand-data
  // ============================================================

  private berekenMaandData(
    facturen: FactuurAgg[],
    transacties: TransactieAgg[],
    van: Date,
    tot: Date
  ): MaandData[] {
    const maanden = new Map<string, { inkomstenCents: number; uitgavenCents: number }>()

    const cursor = new Date(van.getFullYear(), van.getMonth(), 1)
    const eind = new Date(tot.getFullYear(), tot.getMonth(), 1)
    while (cursor <= eind) {
      maanden.set(this.maandKey(cursor), { inkomstenCents: 0, uitgavenCents: 0 })
      cursor.setMonth(cursor.getMonth() + 1)
    }

    for (const f of facturen) {
      if (!OMZET_STATUSSEN.includes(f.status as (typeof OMZET_STATUSSEN)[number])) continue
      const entry = maanden.get(this.maandKey(f.datum))
      if (entry) entry.inkomstenCents += toCents(f.totaalIncl)
    }

    for (const t of transacties) {
      if (t.type !== 'uitgave') continue
      const entry = maanden.get(this.maandKey(t.datum))
      if (entry) entry.uitgavenCents += toCents(t.bedragIncl)
    }

    let saldoCumulatief = 0
    const result: MaandData[] = []
    for (const [maand, data] of Array.from(maanden.entries()).sort()) {
      saldoCumulatief += data.inkomstenCents - data.uitgavenCents
      result.push({
        maand,
        label: this.maandLabel(maand),
        inkomsten: data.inkomstenCents,
        uitgaven: data.uitgavenCents,
        saldo: saldoCumulatief
      })
    }

    return result
  }

  // ============================================================
  // Categorie-breakdown
  // ============================================================

  private berekenCategorieBreakdown(transacties: TransactieAgg[]): CategorieData[] {
    const totalen = new Map<string, number>()

    for (const t of transacties) {
      if (t.type !== 'uitgave') continue
      const cat = t.categorie || 'onbekend'
      totalen.set(cat, (totalen.get(cat) ?? 0) + toCents(t.bedragIncl))
    }

    const totaalCents = Array.from(totalen.values()).reduce((s, v) => s + v, 0)
    if (totaalCents === 0) return []

    const result: CategorieData[] = []
    for (const [categorie, cents] of totalen) {
      result.push({
        categorie,
        label: this.categorieLabel(categorie),
        bedrag: cents,
        percentage: Math.round((cents / totaalCents) * 1000) / 10
      })
    }

    return result.sort((a, b) => b.bedrag - a.bedrag)
  }

  // ============================================================
  // Top klanten
  // ============================================================

  private berekenTopKlanten(facturen: FactuurAgg[]): KlantOmzetData[] {
    const totalen = new Map<number, { naam: string; cents: number }>()

    for (const f of facturen) {
      if (!OMZET_STATUSSEN.includes(f.status as (typeof OMZET_STATUSSEN)[number])) continue
      const key = f.klant.id
      const entry = totalen.get(key) ?? { naam: this.klantNaam(f.klant), cents: 0 }
      entry.cents += toCents(f.totaalIncl)
      totalen.set(key, entry)
    }

    const totaalCents = Array.from(totalen.values()).reduce((s, v) => s + v.cents, 0)
    if (totaalCents === 0) return []

    const sorted = Array.from(totalen.entries())
      .map(([klantId, data]) => ({ klantId, klantNaam: data.naam, cents: data.cents }))
      .sort((a, b) => b.cents - a.cents)

    const top5 = sorted.slice(0, 5)
    const overig = sorted.slice(5)

    const result: KlantOmzetData[] = top5.map((k) => ({
      klantId: k.klantId,
      klantNaam: k.klantNaam,
      bedrag: k.cents,
      percentage: Math.round((k.cents / totaalCents) * 1000) / 10
    }))

    if (overig.length > 0) {
      const overigCents = overig.reduce((s, k) => s + k.cents, 0)
      result.push({
        klantId: -1,
        klantNaam: `Overige (${overig.length} ${overig.length === 1 ? 'klant' : 'klanten'})`,
        bedrag: overigCents,
        percentage: Math.round((overigCents / totaalCents) * 1000) / 10
      })
    }

    return result
  }

  // ============================================================
  // Helpers
  // ============================================================

  private maandKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  private maandLabel(key: string): string {
    const [yyyy, mm] = key.split('-')
    const labels = [
      'jan',
      'feb',
      'mrt',
      'apr',
      'mei',
      'jun',
      'jul',
      'aug',
      'sep',
      'okt',
      'nov',
      'dec'
    ]
    return `${labels[parseInt(mm, 10) - 1]} ${yyyy}`
  }

  private categorieLabel(categorie: string): string {
    if (categorie === 'onbekend') return 'Geen categorie'
    const found = CATEGORIEEN.find((c) => c.value === categorie)
    return found?.label ?? categorie
  }

  private klantNaam(klant: {
    type: string
    bedrijfsnaam: string | null
    voornaam: string | null
    achternaam: string | null
  }): string {
    if (klant.type === 'zakelijk' && klant.bedrijfsnaam) return klant.bedrijfsnaam
    const naam = [klant.voornaam, klant.achternaam].filter(Boolean).join(' ')
    return naam || 'Onbekende klant'
  }
}

export const cashflowService = new CashflowService()
