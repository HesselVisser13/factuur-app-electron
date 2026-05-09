// src/renderer/src/pages/FactuurFormulier/types.ts

import type { BtwTarief } from '@shared/types'
import { toDatumInput } from '@renderer/utils/datum'
import type { RegelFormValues } from './factuurFormSchema'

export type ReistijdInstellingen = {
  uurtarief: number
  kmtarief: number
}

export function emptyRegel(tarief: BtwTarief): RegelFormValues {
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
