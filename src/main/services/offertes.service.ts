// src/main/services/offertes.service.ts

import type { OfferteInput, OfferteStatus, OfferteUpdate } from '../../shared/schemas'
import type { Offerte, OfferteRegel } from '../../shared/types'
import { getDatabase } from '../db/client'
import { log } from '../logger'

import { facturenService } from './facturen.service'

// ============================================================
// Types voor DB-rijen (matched Prisma include)
// ============================================================

type DbKlant = {
  id: number
  type: string
  bedrijfsnaam: string | null
  aanhef: string | null
  voornaam: string | null
  achternaam: string | null
  adres: string | null
  postcode: string | null
  plaats: string | null
  email: string | null
  telefoon: string | null
  kvkNummer: string | null
  btwNummer: string | null
  createdAt: Date
  updatedAt: Date
}

type DbOfferteRegel = {
  id: number
  offerteId: number
  datum: Date
  omschrijving: string
  aantal: number
  prijsPerStuk: number
  btwTariefId: number
  btwPercentage: number
  bedragExcl: number
  btwBedrag: number
  bedragIncl: number
  volgorde: number
}

type DbOfferte = {
  id: number
  offerteNummer: string
  klantId: number
  datum: Date
  geldigTot: Date
  referentie: string | null
  status: string
  opmerkingen: string | null
  toonAkkoordBlok: boolean
  isPrijsopgave: boolean
  totaalExcl: number
  totaalBtw: number
  totaalIncl: number
  reistijdUren: number | null
  reistijdKm: number | null
  reistijdBedragExcl: number | null
  reistijdBtwBedrag: number | null
  reistijdBtwPercentage: number | null
  reistijdBtwTariefId: number | null
  reistijdOmschrijving: string | null
  factuurId: number | null
  createdAt: Date
  updatedAt: Date
  klant: DbKlant
  regels: DbOfferteRegel[]
}

// ============================================================
// Helpers
// ============================================================

function berekenRegelBedragen(regel: {
  aantal: number
  prijsPerStuk: number
  btwPercentage: number
}) {
  const bedragExcl = regel.aantal * regel.prijsPerStuk
  const btwBedrag = bedragExcl * (regel.btwPercentage / 100)
  const bedragIncl = bedragExcl + btwBedrag
  return {
    bedragExcl: Math.round(bedragExcl * 100) / 100,
    btwBedrag: Math.round(btwBedrag * 100) / 100,
    bedragIncl: Math.round(bedragIncl * 100) / 100
  }
}

async function getReistijdTarieven(): Promise<{ uurtarief: number; kmtarief: number }> {
  const prisma = getDatabase()
  const instellingen = await prisma.instelling.findMany({
    where: { key: { in: ['reiskosten_uurtarief', 'reiskosten_kmtarief'] } }
  })
  const map = new Map(instellingen.map((i) => [i.key, i.value]))
  return {
    uurtarief: parseFloat(map.get('reiskosten_uurtarief') || '0') || 0,
    kmtarief: parseFloat(map.get('reiskosten_kmtarief') || '0') || 0
  }
}

function serializeKlant(k: DbKlant) {
  return {
    ...k,
    type: k.type as 'particulier' | 'zakelijk',
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString()
  }
}

function serializeRegel(r: DbOfferteRegel): OfferteRegel {
  return {
    ...r,
    datum: r.datum.toISOString()
  }
}

function serializeOfferte(o: DbOfferte): Offerte {
  return {
    ...o,
    status: o.status as OfferteStatus,
    datum: o.datum.toISOString(),
    geldigTot: o.geldigTot.toISOString(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    klant: serializeKlant(o.klant),
    regels: o.regels.sort((a, b) => a.volgorde - b.volgorde).map(serializeRegel)
  }
}

// ============================================================
// Service
// ============================================================

export class OffertesService {
  async getAll(): Promise<Offerte[]> {
    const prisma = getDatabase()
    const rows = await prisma.offerte.findMany({
      include: { klant: true, regels: true },
      orderBy: { datum: 'desc' }
    })
    return rows.map(serializeOfferte)
  }

  async getById(id: number): Promise<Offerte> {
    const prisma = getDatabase()
    const row = await prisma.offerte.findUniqueOrThrow({
      where: { id },
      include: { klant: true, regels: true }
    })
    return serializeOfferte(row)
  }

  async getNextNummer(datum?: string): Promise<string> {
    const d = datum ? new Date(datum) : new Date()
    return this.genereerOfferteNummer(d)
  }

  async create(input: OfferteInput): Promise<Offerte> {
    const prisma = getDatabase()
    const datum = new Date(input.datum)
    const offerteNummer = await this.genereerOfferteNummer(datum)

    const regelsMetBedragen = input.regels.map((regel, index) => {
      const bedragen = berekenRegelBedragen(regel)
      return {
        datum: new Date(regel.datum),
        omschrijving: regel.omschrijving,
        aantal: regel.aantal,
        prijsPerStuk: regel.prijsPerStuk,
        btwTariefId: regel.btwTariefId,
        btwPercentage: regel.btwPercentage,
        ...bedragen,
        volgorde: index
      }
    })

    let reistijdData = {
      reistijdUren: null as number | null,
      reistijdKm: null as number | null,
      reistijdBedragExcl: null as number | null,
      reistijdBtwBedrag: null as number | null,
      reistijdBtwPercentage: null as number | null,
      reistijdBtwTariefId: null as number | null,
      reistijdOmschrijving: null as string | null
    }

    if (input.reistijd) {
      const { uurtarief, kmtarief } = await getReistijdTarieven()
      const km = input.reistijd.km ?? 0
      const bedragExcl = Math.round((input.reistijd.uren * uurtarief + km * kmtarief) * 100) / 100
      const btwBedrag = Math.round(((bedragExcl * input.reistijd.btwPercentage) / 100) * 100) / 100

      reistijdData = {
        reistijdUren: input.reistijd.uren,
        reistijdKm: input.reistijd.km,
        reistijdBedragExcl: bedragExcl,
        reistijdBtwBedrag: btwBedrag,
        reistijdBtwPercentage: input.reistijd.btwPercentage,
        reistijdBtwTariefId: input.reistijd.btwTariefId,
        reistijdOmschrijving: input.reistijd.omschrijving
      }
    }

    const totaalRegelsExcl = regelsMetBedragen.reduce((s, r) => s + r.bedragExcl, 0)
    const totaalRegelsBtw = regelsMetBedragen.reduce((s, r) => s + r.btwBedrag, 0)
    const totaalExcl =
      Math.round((totaalRegelsExcl + (reistijdData.reistijdBedragExcl || 0)) * 100) / 100
    const totaalBtw =
      Math.round((totaalRegelsBtw + (reistijdData.reistijdBtwBedrag || 0)) * 100) / 100
    const totaalIncl = Math.round((totaalExcl + totaalBtw) * 100) / 100

    const row = await prisma.offerte.create({
      data: {
        offerteNummer,
        klantId: input.klantId,
        datum,
        geldigTot: new Date(input.geldigTot),
        referentie: input.referentie || null,
        opmerkingen: input.opmerkingen || null,
        toonAkkoordBlok: input.toonAkkoordBlok,
        isPrijsopgave: input.isPrijsopgave,
        status: 'concept',
        totaalExcl,
        totaalBtw,
        totaalIncl,
        ...reistijdData,
        regels: { create: regelsMetBedragen }
      },
      include: { klant: true, regels: true }
    })

    log.info(`[offertes] Aangemaakt: ${offerteNummer}`)
    return serializeOfferte(row)
  }

  async update(input: OfferteUpdate): Promise<Offerte> {
    const prisma = getDatabase()
    const bestaand = await prisma.offerte.findUniqueOrThrow({ where: { id: input.id } })

    if (bestaand.status !== 'concept') {
      throw new Error(`Alleen concept-offertes kunnen bewerkt worden. Status: ${bestaand.status}`)
    }

    const regelsMetBedragen = input.regels.map((regel, index) => {
      const bedragen = berekenRegelBedragen(regel)
      return {
        datum: new Date(regel.datum),
        omschrijving: regel.omschrijving,
        aantal: regel.aantal,
        prijsPerStuk: regel.prijsPerStuk,
        btwTariefId: regel.btwTariefId,
        btwPercentage: regel.btwPercentage,
        ...bedragen,
        volgorde: index
      }
    })

    let reistijdData = {
      reistijdUren: null as number | null,
      reistijdKm: null as number | null,
      reistijdBedragExcl: null as number | null,
      reistijdBtwBedrag: null as number | null,
      reistijdBtwPercentage: null as number | null,
      reistijdBtwTariefId: null as number | null,
      reistijdOmschrijving: null as string | null
    }

    if (input.reistijd) {
      const { uurtarief, kmtarief } = await getReistijdTarieven()
      const km = input.reistijd.km ?? 0
      const bedragExcl = Math.round((input.reistijd.uren * uurtarief + km * kmtarief) * 100) / 100
      const btwBedrag = Math.round(((bedragExcl * input.reistijd.btwPercentage) / 100) * 100) / 100

      reistijdData = {
        reistijdUren: input.reistijd.uren,
        reistijdKm: input.reistijd.km,
        reistijdBedragExcl: bedragExcl,
        reistijdBtwBedrag: btwBedrag,
        reistijdBtwPercentage: input.reistijd.btwPercentage,
        reistijdBtwTariefId: input.reistijd.btwTariefId,
        reistijdOmschrijving: input.reistijd.omschrijving
      }
    }

    const totaalRegelsExcl = regelsMetBedragen.reduce((s, r) => s + r.bedragExcl, 0)
    const totaalRegelsBtw = regelsMetBedragen.reduce((s, r) => s + r.btwBedrag, 0)
    const totaalExcl =
      Math.round((totaalRegelsExcl + (reistijdData.reistijdBedragExcl || 0)) * 100) / 100
    const totaalBtw =
      Math.round((totaalRegelsBtw + (reistijdData.reistijdBtwBedrag || 0)) * 100) / 100
    const totaalIncl = Math.round((totaalExcl + totaalBtw) * 100) / 100

    const row = await prisma.$transaction(async (tx) => {
      await tx.offerteRegel.deleteMany({ where: { offerteId: input.id } })

      return tx.offerte.update({
        where: { id: input.id },
        data: {
          klantId: input.klantId,
          datum: new Date(input.datum),
          geldigTot: new Date(input.geldigTot),
          referentie: input.referentie || null,
          opmerkingen: input.opmerkingen || null,
          toonAkkoordBlok: input.toonAkkoordBlok,
          isPrijsopgave: input.isPrijsopgave,
          totaalExcl,
          totaalBtw,
          totaalIncl,
          ...reistijdData,
          regels: { create: regelsMetBedragen }
        },
        include: { klant: true, regels: true }
      })
    })

    log.info(`[offertes] Bijgewerkt: ${row.offerteNummer}`)
    return serializeOfferte(row)
  }

  async updateStatus(id: number, status: OfferteStatus): Promise<Offerte> {
    const prisma = getDatabase()
    const bestaand = await prisma.offerte.findUniqueOrThrow({ where: { id } })

    if (bestaand.status === 'omgezet') {
      throw new Error('Deze offerte is al omgezet naar factuur')
    }
    if (status === 'omgezet') {
      throw new Error('Gebruik converteerNaarFactuur() om om te zetten')
    }

    const row = await prisma.offerte.update({
      where: { id },
      data: { status },
      include: { klant: true, regels: true }
    })

    log.info(`[offertes] Status: ${row.offerteNummer} → ${status}`)
    return serializeOfferte(row)
  }

  async delete(id: number): Promise<void> {
    const prisma = getDatabase()
    const bestaand = await prisma.offerte.findUniqueOrThrow({ where: { id } })

    if (bestaand.factuurId !== null) {
      throw new Error('Deze offerte is omgezet naar factuur en kan niet verwijderd worden')
    }
    if (bestaand.status !== 'concept') {
      throw new Error(
        `Alleen concept-offertes kunnen verwijderd worden. Status: ${bestaand.status}`
      )
    }

    await prisma.offerte.delete({ where: { id } })
    log.info(`[offertes] Verwijderd: id ${id}`)
  }

  async markeerVerlopen(): Promise<number> {
    const prisma = getDatabase()
    const result = await prisma.offerte.updateMany({
      where: {
        status: 'verzonden',
        geldigTot: { lt: new Date() }
      },
      data: { status: 'verlopen' }
    })
    if (result.count > 0) {
      log.info(`[offertes] ${result.count} offertes gemarkeerd als verlopen`)
    }
    return result.count
  }

  async converteerNaarFactuur(id: number): Promise<{ offerte: Offerte; factuurId: number }> {
    const prisma = getDatabase()

    const offerte = await prisma.offerte.findUniqueOrThrow({
      where: { id },
      include: { regels: true }
    })

    if (offerte.factuurId !== null) {
      throw new Error('Deze offerte is al omgezet naar factuur')
    }
    if (offerte.status !== 'geaccepteerd') {
      throw new Error(
        `Alleen geaccepteerde offertes kunnen omgezet worden. Status: ${offerte.status}`
      )
    }

    const vervalDatum = new Date()
    vervalDatum.setDate(vervalDatum.getDate() + 14)

    const factuur = await facturenService.create({
      klantId: offerte.klantId,
      datum: new Date().toISOString().slice(0, 10),
      vervalDatum: vervalDatum.toISOString().slice(0, 10),
      referentie: offerte.referentie || undefined,
      opmerkingen: offerte.opmerkingen || undefined,
      regels: offerte.regels
        .sort((a, b) => a.volgorde - b.volgorde)
        .map((r) => ({
          datum: r.datum.toISOString().slice(0, 10),
          omschrijving: r.omschrijving,
          aantal: r.aantal,
          prijsPerStuk: r.prijsPerStuk,
          btwTariefId: r.btwTariefId,
          btwPercentage: r.btwPercentage
        })),
      reistijd:
        offerte.reistijdBtwTariefId !== null && offerte.reistijdBtwPercentage !== null
          ? {
              uren: offerte.reistijdUren ?? 0,
              km: offerte.reistijdKm,
              btwTariefId: offerte.reistijdBtwTariefId,
              btwPercentage: offerte.reistijdBtwPercentage,
              omschrijving: offerte.reistijdOmschrijving ?? 'Reistijd'
            }
          : null
    })

    await prisma.offerte.update({
      where: { id },
      data: {
        factuurId: factuur.id,
        status: 'omgezet'
      }
    })

    const updated = await this.getById(id)
    log.info(`[offertes] Omgezet: ${offerte.offerteNummer} → factuur ${factuur.factuurNummer}`)

    return { offerte: updated, factuurId: factuur.id }
  }

  // ============================================================
  // Internals
  // ============================================================

  private async genereerOfferteNummer(datum: Date): Promise<string> {
    const prisma = getDatabase()
    const jaar = datum.getFullYear()
    const prefix = `${jaar}-O`

    const laatste = await prisma.offerte.findFirst({
      where: { offerteNummer: { startsWith: prefix } },
      orderBy: { offerteNummer: 'desc' },
      select: { offerteNummer: true }
    })

    let volgnummer = 1
    if (laatste) {
      const match = laatste.offerteNummer.match(/-O(\d+)$/)
      if (match) {
        volgnummer = parseInt(match[1], 10) + 1
      }
    }

    return `${prefix}${String(volgnummer).padStart(3, '0')}`
  }
}

export const offertesService = new OffertesService()
