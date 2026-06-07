// src/renderer/src/pages/FactuurFormulier/factuurFormSchema.ts

import { z } from 'zod'

import {
  datumString,
  documentBaseFields,
  valideerReistijd
} from '@renderer/components/document-form'
import { isGeldigeDatumString } from '@renderer/utils/datum'

// ============================================================
// Form
// ============================================================

export const FactuurFormSchema = z
  .object({
    ...documentBaseFields,
    vervalDatum: datumString
  })
  .superRefine((data, ctx) => {
    // Vervaldatum >= datum
    if (
      isGeldigeDatumString(data.datum) &&
      isGeldigeDatumString(data.vervalDatum) &&
      new Date(data.vervalDatum) < new Date(data.datum)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['vervalDatum'],
        message: 'Vervaldatum moet op of na de factuurdatum zijn'
      })
    }

    valideerReistijd(data.reistijd, ctx)
  })

export type FactuurFormValues = z.input<typeof FactuurFormSchema>
export type FactuurFormOutput = z.output<typeof FactuurFormSchema>

// Re-export voor backwards compat met bestaande imports
export type { RegelFormValues } from '@renderer/components/document-form'
export { RegelFormSchema } from '@renderer/components/document-form'
