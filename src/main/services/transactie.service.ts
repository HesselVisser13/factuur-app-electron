// src/main/services/transactie.service.ts

import { getDatabase } from '../db/client'
import { berekenBedragen } from './berekening.service'
import type { TransactieInput } from '../../shared/schemas'

export class TransactieService {
  async getByPeriode(van: string, tot: string) {
    const prisma = getDatabase()
    return prisma.transactie.findMany({
      where: {
        datum: { gte: new Date(van), lte: new Date(tot) }
      },
      include: { btwTarief: true },
      orderBy: { datum: 'desc' }
    })
  }

  async create(input: TransactieInput) {
    const prisma = getDatabase()
    const { bedragExcl, btwBedrag, bedragIncl } = berekenBedragen(
      input.bedrag,
      input.invoerwijze,
      input.btwPercentage
    )

    return prisma.transactie.create({
      data: {
        type: input.type,
        omschrijving: input.omschrijving,
        bedrag: input.bedrag,
        invoerwijze: input.invoerwijze,
        btwTariefId: input.btwTariefId,
        btwPercentage: input.btwPercentage,
        datum: new Date(input.datum),
        categorie: input.categorie || null,
        notitie: input.notitie || null,
        bedragExcl,
        btwBedrag,
        bedragIncl
      },
      include: { btwTarief: true }
    })
  }

  async delete(id: number) {
    const prisma = getDatabase()
    return prisma.transactie.delete({ where: { id } })
  }
}

export const transactieService = new TransactieService()
