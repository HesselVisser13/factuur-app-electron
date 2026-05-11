//src/renderer/src/pages/Transacties/types.ts

import { datumInputUit, toDatumInput } from '@renderer/utils/datum'
import type { BtwTarief, Transactie } from '@shared/types'
import type { TransactieFormValues } from './transactieFormSchema'

export function buildEmptyForm(tarieven: BtwTarief[]): TransactieFormValues {
  return {
    type: 'inkomst',
    omschrijving: '',
    bedrag: '',
    invoerwijze: 'exclusief',
    btwTariefId: tarieven[0]?.id ? String(tarieven[0].id) : '',
    datum: toDatumInput(),
    categorie: ''
  }
}

export function transactieToFormValues(t: Transactie): TransactieFormValues {
  return {
    type: t.type,
    omschrijving: t.omschrijving,
    bedrag: String(t.bedrag),
    invoerwijze: t.invoerwijze,
    btwTariefId: String(t.btwTariefId),
    datum: datumInputUit(t.datum),
    categorie: t.categorie || ''
  }
}

/**
 * State-machine voor de inline form.
 * Voorkomt bugs van "twee booleans tegelijk".
 */
export type FormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; transactie: Transactie }
