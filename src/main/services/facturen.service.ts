// src/main/services/facturen.service.ts

import { getDatabase } from '../db/client'
import type {
  FactuurInput,
  FactuurUpdate,
  FactuurRegelInput,
  FactuurStatus,
  ReistijdInput
} from '../../shared/schemas'
import type { Factuur, FactuurRegel, Klant } from '../../shared/types'

// ============================================================
// Helpers: berekeningen
// ============================================================

function berekenRegelBedragen(regel: FactuurRegelInput) {
  const bedragExcl = regel.aantal * regel.prijsPerStuk
  const btwBedrag = bedragExcl * (regel.btwPercentage / 100)
  const bedragIncl = bedragExcl + btwBedrag
  return {
    bedragExcl: Math.round(bedragExcl * 100) / 100,
    btwBedrag: Math.round(btwBedrag * 100) / 100,
    bedragIncl: Math.round(bedragIncl * 100) / 100
  }
}

function berekenReistijdBedragen(reistijd: ReistijdInput, uurtarief: number, kmtarief: number) {
  const reistijdBedrag = reistijd.uren * uurtarief
  const km = reistijd.km || 0
  const kmBedrag = km * kmtarief
  const bedragExcl = Math.round((reistijdBedrag + kmBedrag) * 100) / 100
  const btwBedrag = Math.round(((bedragExcl * reistijd.btwPercentage) / 100) * 100) / 100
  return {
    bedragExcl,
    btwBedrag,
    bedragIncl: Math.round((bedragExcl + btwBedrag) * 100) / 100
  }
}

function berekenTotalen(
  regels: Array<{ bedragExcl: number; btwBedrag: number; bedragIncl: number }>
) {
  const totaalExcl = regels.reduce((sum, r) => sum + r.bedragExcl, 0)
  const totaalBtw = regels.reduce((sum, r) => sum + r.btwBedrag, 0)
  const totaalIncl = regels.reduce((sum, r) => sum + r.bedragIncl, 0)
  return {
    totaalExcl: Math.round(totaalExcl * 100) / 100,
    totaalBtw: Math.round(totaalBtw * 100) / 100,
    totaalIncl: Math.round(totaalIncl * 100) / 100
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

// ============================================================
// Helpers: factuurnummer
// ============================================================

/**
 * Volgende factuurnummer binnen het jaar van gegeven datum.
 * Format: YYYY-NNN (bv. 2026-001). Reset per jaar.
 */
async function genereerFactuurnummer(datum: Date): Promise<string> {
  const prisma = getDatabase()
  const jaar = datum.getFullYear()
  const prefix = `${jaar}-`

  const laatste = await prisma.factuur.findFirst({
    where: { factuurNummer: { startsWith: prefix } },
    orderBy: { factuurNummer: 'desc' }
  })

  let volgnummer = 1
  if (laatste) {
    const huidig = parseInt(laatste.factuurNummer.substring(prefix.length), 10)
    if (!isNaN(huidig)) volgnummer = huidig + 1
  }

  return `${prefix}${String(volgnummer).padStart(3, '0')}`
}

// ============================================================
// Helpers: serialisatie
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

type DbRegel = {
  id: number
  factuurId: number
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

type DbFactuur = {
  id: number
  factuurNummer: string
  klantId: number
  datum: Date
  vervalDatum: Date
  referentie: string | null
  status: string
  opmerkingen: string | null
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
  createdAt: Date
  updatedAt: Date
  klant: DbKlant
  regels: DbRegel[]
}

function serializeKlant(k: DbKlant): Klant {
  return {
    ...k,
    type: k.type as 'particulier' | 'zakelijk',
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString()
  }
}

function serializeRegel(r: DbRegel): FactuurRegel {
  return {
    ...r,
    datum: r.datum.toISOString()
  }
}

function serializeFactuur(f: DbFactuur): Factuur {
  return {
    ...f,
    status: f.status as FactuurStatus,
    datum: f.datum.toISOString(),
    vervalDatum: f.vervalDatum.toISOString(),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    klant: serializeKlant(f.klant),
    regels: f.regels.sort((a, b) => a.volgorde - b.volgorde).map(serializeRegel)
  }
}

// ============================================================
// Service
// ============================================================

export class FacturenService {
  async getAll(): Promise<Factuur[]> {
    const prisma = getDatabase()
    const facturen = await prisma.factuur.findMany({
      include: { klant: true, regels: true },
      orderBy: { datum: 'desc' }
    })
    return facturen.map(serializeFactuur)
  }

  async getById(id: number): Promise<Factuur> {
    const prisma = getDatabase()
    const factuur = await prisma.factuur.findUniqueOrThrow({
      where: { id },
      include: { klant: true, regels: true }
    })
    return serializeFactuur(factuur)
  }

  async getNextNummer(datum?: string): Promise<string> {
    const d = datum ? new Date(datum) : new Date()
    return genereerFactuurnummer(d)
  }

  async create(input: FactuurInput): Promise<Factuur> {
    const prisma = getDatabase()
    const datum = new Date(input.datum)
    const factuurNummer = await genereerFactuurnummer(datum)

    // Bereken bedragen per regel
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

    // Reistijd berekenen (indien aanwezig)
    let reistijdData: {
      reistijdUren: number | null
      reistijdKm: number | null
      reistijdBedragExcl: number | null
      reistijdBtwBedrag: number | null
      reistijdBtwPercentage: number | null
      reistijdBtwTariefId: number | null
      reistijdOmschrijving: string | null
    } = {
      reistijdUren: null,
      reistijdKm: null,
      reistijdBedragExcl: null,
      reistijdBtwBedrag: null,
      reistijdBtwPercentage: null,
      reistijdBtwTariefId: null,
      reistijdOmschrijving: null
    }

    if (input.reistijd) {
      const { uurtarief, kmtarief } = await getReistijdTarieven()
      const reisBedragen = berekenReistijdBedragen(input.reistijd, uurtarief, kmtarief)
      reistijdData = {
        reistijdUren: input.reistijd.uren,
        reistijdKm: input.reistijd.km ?? null,
        reistijdBedragExcl: reisBedragen.bedragExcl,
        reistijdBtwBedrag: reisBedragen.btwBedrag,
        reistijdBtwPercentage: input.reistijd.btwPercentage,
        reistijdBtwTariefId: input.reistijd.btwTariefId,
        reistijdOmschrijving: input.reistijd.omschrijving
      }
    }

    // Totalen = regels + reistijd
    const totalenRegels = berekenTotalen(regelsMetBedragen)
    const totalen = {
      totaalExcl:
        Math.round((totalenRegels.totaalExcl + (reistijdData.reistijdBedragExcl || 0)) * 100) / 100,
      totaalBtw:
        Math.round((totalenRegels.totaalBtw + (reistijdData.reistijdBtwBedrag || 0)) * 100) / 100,
      totaalIncl:
        Math.round(
          (totalenRegels.totaalIncl +
            (reistijdData.reistijdBedragExcl || 0) +
            (reistijdData.reistijdBtwBedrag || 0)) *
            100
        ) / 100
    }

    const factuur = await prisma.factuur.create({
      data: {
        factuurNummer,
        klantId: input.klantId,
        datum,
        vervalDatum: new Date(input.vervalDatum),
        referentie: input.referentie || null,
        opmerkingen: input.opmerkingen || null,
        status: 'concept',
        ...totalen,
        ...reistijdData,
        regels: { create: regelsMetBedragen }
      },
      include: { klant: true, regels: true }
    })

    return serializeFactuur(factuur)
  }

  async update(input: FactuurUpdate): Promise<Factuur> {
    const prisma = getDatabase()

    const bestaand = await prisma.factuur.findUniqueOrThrow({ where: { id: input.id } })
    if (bestaand.status !== 'concept') {
      throw new Error(
        `Alleen concept-facturen kunnen bewerkt worden. Deze factuur heeft status: ${bestaand.status}`
      )
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

    // Reistijd
    let reistijdData: {
      reistijdUren: number | null
      reistijdKm: number | null
      reistijdBedragExcl: number | null
      reistijdBtwBedrag: number | null
      reistijdBtwPercentage: number | null
      reistijdBtwTariefId: number | null
      reistijdOmschrijving: string | null
    } = {
      reistijdUren: null,
      reistijdKm: null,
      reistijdBedragExcl: null,
      reistijdBtwBedrag: null,
      reistijdBtwPercentage: null,
      reistijdBtwTariefId: null,
      reistijdOmschrijving: null
    }

    if (input.reistijd) {
      const { uurtarief, kmtarief } = await getReistijdTarieven()
      const reisBedragen = berekenReistijdBedragen(input.reistijd, uurtarief, kmtarief)
      reistijdData = {
        reistijdUren: input.reistijd.uren,
        reistijdKm: input.reistijd.km ?? null,
        reistijdBedragExcl: reisBedragen.bedragExcl,
        reistijdBtwBedrag: reisBedragen.btwBedrag,
        reistijdBtwPercentage: input.reistijd.btwPercentage,
        reistijdBtwTariefId: input.reistijd.btwTariefId,
        reistijdOmschrijving: input.reistijd.omschrijving
      }
    }

    const totalenRegels = berekenTotalen(regelsMetBedragen)
    const totalen = {
      totaalExcl:
        Math.round((totalenRegels.totaalExcl + (reistijdData.reistijdBedragExcl || 0)) * 100) / 100,
      totaalBtw:
        Math.round((totalenRegels.totaalBtw + (reistijdData.reistijdBtwBedrag || 0)) * 100) / 100,
      totaalIncl:
        Math.round(
          (totalenRegels.totaalIncl +
            (reistijdData.reistijdBedragExcl || 0) +
            (reistijdData.reistijdBtwBedrag || 0)) *
            100
        ) / 100
    }

    const factuur = await prisma.$transaction(async (tx) => {
      await tx.factuurRegel.deleteMany({ where: { factuurId: input.id } })

      return tx.factuur.update({
        where: { id: input.id },
        data: {
          klantId: input.klantId,
          datum: new Date(input.datum),
          vervalDatum: new Date(input.vervalDatum),
          referentie: input.referentie || null,
          opmerkingen: input.opmerkingen || null,
          ...totalen,
          ...reistijdData,
          regels: { create: regelsMetBedragen }
        },
        include: { klant: true, regels: true }
      })
    })

    return serializeFactuur(factuur)
  }

  async updateStatus(id: number, status: FactuurStatus): Promise<Factuur> {
    const prisma = getDatabase()
    const bestaand = await prisma.factuur.findUniqueOrThrow({
      where: { id },
      include: { klant: true, regels: true }
    })

    // Bij overgang concept → verstuurd: transacties aanmaken (per regel)
    if (bestaand.status === 'concept' && status === 'verstuurd') {
      await this.maakTransactiesVoorFactuur(bestaand)
    }

    // Bij overgang verstuurd → geannuleerd: transacties verwijderen
    if (bestaand.status === 'verstuurd' && status === 'geannuleerd') {
      await this.verwijderTransactiesVoorFactuur(bestaand.factuurNummer)
    }

    const factuur = await prisma.factuur.update({
      where: { id },
      data: { status },
      include: { klant: true, regels: true }
    })

    return serializeFactuur(factuur)
  }

  async delete(id: number): Promise<void> {
    const prisma = getDatabase()
    const bestaand = await prisma.factuur.findUniqueOrThrow({ where: { id } })

    if (bestaand.status !== 'concept') {
      throw new Error(
        `Alleen concept-facturen kunnen verwijderd worden. Deze factuur heeft status: ${bestaand.status}. ` +
          `Gebruik "annuleren" om een verstuurde factuur ongeldig te maken.`
      )
    }

    await prisma.factuur.delete({ where: { id } })
  }

  // ============================================================
  // Transactie-koppeling (per regel = optie B)
  // ============================================================

  private async maakTransactiesVoorFactuur(factuur: DbFactuur): Promise<void> {
    const prisma = getDatabase()
    const klantNaam =
      factuur.klant.type === 'zakelijk'
        ? factuur.klant.bedrijfsnaam || 'Onbekende klant'
        : [factuur.klant.aanhef, factuur.klant.voornaam, factuur.klant.achternaam]
            .filter(Boolean)
            .join(' ') || 'Onbekende klant'

    for (const regel of factuur.regels) {
      await prisma.transactie.create({
        data: {
          type: 'inkomst',
          omschrijving: `Factuur ${factuur.factuurNummer} - ${klantNaam} - ${regel.omschrijving}`,
          bedrag: regel.bedragExcl,
          invoerwijze: 'exclusief',
          btwTariefId: regel.btwTariefId,
          btwPercentage: regel.btwPercentage,
          bedragExcl: regel.bedragExcl,
          btwBedrag: regel.btwBedrag,
          bedragIncl: regel.bedragIncl,
          datum: factuur.datum,
          categorie: 'Factuur',
          notitie: `Gekoppeld aan factuur ${factuur.factuurNummer}`
        }
      })
    }
    if (
      factuur.reistijdBedragExcl &&
      factuur.reistijdBtwTariefId &&
      factuur.reistijdBtwPercentage !== null
    ) {
      await prisma.transactie.create({
        data: {
          type: 'inkomst',
          omschrijving: `Factuur ${factuur.factuurNummer} - ${klantNaam} - ${factuur.reistijdOmschrijving || 'Reistijd'}`,
          bedrag: factuur.reistijdBedragExcl,
          invoerwijze: 'exclusief',
          btwTariefId: factuur.reistijdBtwTariefId,
          btwPercentage: factuur.reistijdBtwPercentage,
          bedragExcl: factuur.reistijdBedragExcl,
          btwBedrag: factuur.reistijdBtwBedrag || 0,
          bedragIncl: (factuur.reistijdBedragExcl || 0) + (factuur.reistijdBtwBedrag || 0),
          datum: factuur.datum,
          categorie: 'Reistijd',
          notitie: `Gekoppeld aan factuur ${factuur.factuurNummer}`
        }
      })
    }
  }

  private async verwijderTransactiesVoorFactuur(factuurNummer: string): Promise<void> {
    const prisma = getDatabase()
    await prisma.transactie.deleteMany({
      where: { notitie: `Gekoppeld aan factuur ${factuurNummer}` }
    })
  }
}

export const facturenService = new FacturenService()
