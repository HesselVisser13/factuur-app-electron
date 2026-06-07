// src/renderer/src/components/document-form/types.ts

import { toDatumInput } from '@renderer/utils/datum'

export type RegelFormValues = {
  _uid: string
  datum: string
  omschrijving: string
  aantal: string
  prijsPerStuk: string
  btwTariefId: number
  btwPercentage: number
}

export type ReistijdFormValues = {
  enabled: boolean
  uren: string
  km: string
  omschrijving: string
  btwTariefId: number | null
  btwPercentage: number
}

/**
 * Gedeelde shape voor formulieren die "regels + reistijd + klant" hebben
 * (Factuur, Offerte). Elk type extend dit met eigen specifieke velden.
 */
export type DocumentFormShape = {
  klantId: number | null
  datum: string
  referentie: string
  opmerkingen: string
  regels: RegelFormValues[]
  reistijd: ReistijdFormValues
}

export type ReistijdInstellingen = {
  uurtarief: number
  kmtarief: number
}

export function emptyRegel(tarief: { id: number; percentage: number }): RegelFormValues {
  return {
    _uid: crypto.randomUUID(),
    datum: toDatumInput(),
    omschrijving: '',
    aantal: '1',
    prijsPerStuk: '',
    btwTariefId: tarief.id,
    btwPercentage: tarief.percentage
  }
}
