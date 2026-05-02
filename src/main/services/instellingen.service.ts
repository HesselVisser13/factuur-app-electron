// src/main/services/instellingen.service.ts

import { getDatabase } from '../db/client'

export class InstellingenService {
  async getAll(): Promise<Record<string, string>> {
    const prisma = getDatabase()
    const instellingen = await prisma.instelling.findMany()

    const result: Record<string, string> = {}
    for (const instelling of instellingen) {
      result[instelling.key] = instelling.value
    }
    return result
  }

  async save(data: Record<string, string>): Promise<void> {
    const prisma = getDatabase()

    for (const [key, value] of Object.entries(data)) {
      await prisma.instelling.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    }
  }
}

export const instellingenService = new InstellingenService()
