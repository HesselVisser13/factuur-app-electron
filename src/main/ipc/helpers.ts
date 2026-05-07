// src/main/ipc/helpers.ts

import type { IpcResult } from '../../shared/types'
import { ZodSchema } from 'zod'
import { log } from '../logger'

export function createHandler<T>(handler: (...args: any[]) => Promise<T>) {
  return async (...args: any[]): Promise<IpcResult<T>> => {
    try {
      const data = await handler(...args)
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout'
      log.error('[IPC Error]', message, error)
      return { success: false, error: message }
    }
  }
}

// ============================================================
// Veldnamen → mensentaal
// ============================================================

const veldLabels: Record<string, string> = {
  // Algemeen
  klantId: 'Klant',
  datum: 'Datum',
  vervalDatum: 'Vervaldatum',
  referentie: 'Referentie',
  opmerkingen: 'Opmerkingen',
  type: 'Type',

  regels: 'Factuurregels',
  omschrijving: 'Omschrijving',
  aantal: 'Aantal',
  prijsPerStuk: 'Stuksprijs',
  btwTariefId: 'BTW-tarief',
  btwPercentage: 'BTW-percentage',

  reistijd: 'Reistijd',
  uren: 'Reistijd (uren)',
  km: 'Kilometers',

  bedrijfsnaam: 'Bedrijfsnaam',
  aanhef: 'Aanhef',
  voornaam: 'Voornaam',
  achternaam: 'Achternaam',
  adres: 'Adres',
  postcode: 'Postcode',
  plaats: 'Plaats',
  email: 'E-mail',
  telefoon: 'Telefoon',
  kvkNummer: 'KvK-nummer',
  btwNummer: 'BTW-nummer',

  bedrag: 'Bedrag',
  invoerwijze: 'Invoerwijze',
  categorie: 'Categorie',
  notitie: 'Notitie',

  van: 'Startdatum',
  tot: 'Einddatum',
  kwartaal: 'Kwartaal',
  jaar: 'Jaar',

  status: 'Status',
  id: 'ID'
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) return ''

  if (path[0] === 'regels' && typeof path[1] === 'number' && path[2]) {
    const regelNr = (path[1] as number) + 1
    const veldKey = String(path[2])
    const veld = veldLabels[veldKey] || veldKey
    return `${veld} (regel ${regelNr})`
  }

  if (path[0] === 'reistijd' && path[1]) {
    const veldKey = String(path[1])
    const veld = veldLabels[veldKey] || veldKey
    return `Reistijd – ${veld}`
  }

  const laatste = path[path.length - 1]
  const key = String(laatste)
  return veldLabels[key] || key
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const meldingen = result.error.issues.map((e) => {
      const veld = formatPath(e.path)
      return veld ? `• ${veld}: ${e.message}` : `• ${e.message}`
    })

    const errorBericht =
      meldingen.length === 1 ? meldingen[0].replace(/^• /, '') : meldingen.join('\n')

    throw new Error(errorBericht)
  }
  return result.data
}
