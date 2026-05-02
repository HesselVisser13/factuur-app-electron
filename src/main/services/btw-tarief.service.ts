// src/main/services/btw-tarief.service.ts

import { getDatabase } from '../db/client'

export class BtwTariefService {
  async getActief() {
    const prisma = getDatabase()
    return prisma.btwTarief.findMany({
      where: { geldigTot: null },
      orderBy: { percentage: 'desc' }
    })
  }
}

export const btwTariefService = new BtwTariefService()
