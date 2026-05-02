import { getDatabase } from '../db/client'
import type { KlantInput, KlantUpdate } from '../../shared/schemas'
import type { Klant } from '../../shared/types'

function serialize(k: {
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
}): Klant {
  return {
    ...k,
    type: k.type as 'particulier' | 'zakelijk',
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString()
  }
}

export class KlantenService {
  async getAll(): Promise<Klant[]> {
    const prisma = getDatabase()
    const klanten = await prisma.klant.findMany({
      orderBy: { bedrijfsnaam: 'asc' }
    })
    return klanten.map(serialize)
  }

  async create(input: KlantInput): Promise<Klant> {
    const prisma = getDatabase()
    const klant = await prisma.klant.create({
      data: {
        type: input.type,
        bedrijfsnaam: input.bedrijfsnaam || null,
        aanhef: input.aanhef || null,
        voornaam: input.voornaam || null,
        achternaam: input.achternaam || null,
        adres: input.adres || null,
        postcode: input.postcode || null,
        plaats: input.plaats || null,
        email: input.email || null,
        telefoon: input.telefoon || null,
        kvkNummer: input.kvkNummer || null,
        btwNummer: input.btwNummer || null
      }
    })
    return serialize(klant)
  }

  async update(input: KlantUpdate): Promise<Klant> {
    const prisma = getDatabase()
    const klant = await prisma.klant.update({
      where: { id: input.id },
      data: {
        type: input.type,
        bedrijfsnaam: input.bedrijfsnaam || null,
        aanhef: input.aanhef || null,
        voornaam: input.voornaam || null,
        achternaam: input.achternaam || null,
        adres: input.adres || null,
        postcode: input.postcode || null,
        plaats: input.plaats || null,
        email: input.email || null,
        telefoon: input.telefoon || null,
        kvkNummer: input.kvkNummer || null,
        btwNummer: input.btwNummer || null
      }
    })
    return serialize(klant)
  }

  async delete(id: number): Promise<void> {
    const prisma = getDatabase()
    await prisma.klant.delete({ where: { id } })
  }
}

export const klantenService = new KlantenService()
