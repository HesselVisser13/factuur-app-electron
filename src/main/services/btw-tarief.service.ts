import type { BtwTariefInput, BtwTariefUpdate } from '../../shared/schemas'
import { getDatabase } from '../db/client'
import { log } from '../logger'

export class BtwTariefService {
  /** Alle actieve BTW-tarieven, hoog naar laag percentage. */
  async getActief() {
    const prisma = getDatabase()
    return prisma.btwTarief.findMany({
      where: { geldigTot: null },
      orderBy: { percentage: 'desc' }
    })
  }

  /** Maak een nieuw BTW-tarief. */
  async create(input: BtwTariefInput) {
    const prisma = getDatabase()

    // Check of naam al bestaat (case-insensitive)
    const existing = await prisma.btwTarief.findFirst({
      where: {
        naam: { equals: input.naam.trim() },
        geldigTot: null
      }
    })
    if (existing) {
      throw new Error(`Er bestaat al een actief tarief met naam "${input.naam.trim()}"`)
    }

    const tarief = await prisma.btwTarief.create({
      data: {
        naam: input.naam.trim(),
        percentage: input.percentage,
        geldigVanaf: new Date(),
        bron: 'manual'
      }
    })
    log.info(`[btw-tarief] Aangemaakt: ${tarief.naam} (${tarief.percentage}%)`)
    return tarief
  }

  /** Werk een BTW-tarief bij. */
  async update(input: BtwTariefUpdate) {
    const prisma = getDatabase()

    // Check op naam-conflict (andere tarief met dezelfde naam)
    const existing = await prisma.btwTarief.findFirst({
      where: {
        naam: { equals: input.naam.trim() },
        geldigTot: null,
        NOT: { id: input.id }
      }
    })
    if (existing) {
      throw new Error(`Er bestaat al een actief tarief met naam "${input.naam.trim()}"`)
    }

    const tarief = await prisma.btwTarief.update({
      where: { id: input.id },
      data: {
        naam: input.naam.trim(),
        percentage: input.percentage
      }
    })
    log.info(`[btw-tarief] Bijgewerkt: id ${input.id} → ${tarief.naam} (${tarief.percentage}%)`)
    return tarief
  }

  /**
   * Verwijder een BTW-tarief.
   * Weigert als het tarief in gebruik is bij facturen, transacties of factuurregels.
   */
  async delete(id: number): Promise<void> {
    const prisma = getDatabase()

    // Tel gebruik in alle gerelateerde tabellen
    const [factuurRegels, transacties, facturenReistijd] = await Promise.all([
      prisma.factuurRegel.count({ where: { btwTariefId: id } }),
      prisma.transactie.count({ where: { btwTariefId: id } }),
      prisma.factuur.count({ where: { reistijdBtwTariefId: id } })
    ])

    const totalUsage = factuurRegels + transacties + facturenReistijd
    if (totalUsage > 0) {
      const parts: string[] = []
      if (factuurRegels > 0) {
        parts.push(`${factuurRegels} ${factuurRegels === 1 ? 'factuurregel' : 'factuurregels'}`)
      }
      if (transacties > 0) {
        parts.push(`${transacties} ${transacties === 1 ? 'transactie' : 'transacties'}`)
      }
      if (facturenReistijd > 0) {
        parts.push(
          `${facturenReistijd} ${facturenReistijd === 1 ? 'reistijd-factuur' : 'reistijd-facturen'}`
        )
      }

      throw new Error(
        `Dit BTW-tarief kan niet verwijderd worden: het is in gebruik bij ${parts.join(', ')}.\n\n` +
          `Voor de administratie moeten BTW-tarieven van bestaande facturen behouden blijven.`
      )
    }

    await prisma.btwTarief.delete({ where: { id } })
    log.info(`[btw-tarief] Verwijderd: id ${id}`)
  }
}

export const btwTariefService = new BtwTariefService()
