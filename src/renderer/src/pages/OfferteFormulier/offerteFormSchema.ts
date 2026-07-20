// src/renderer/src/pages/OfferteFormulier/offerteFormSchema.ts

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

export const OfferteFormSchema = z
  .object({
    ...documentBaseFields,
    geldigTot: datumString,
    toonAkkoordBlok: z.boolean(),
    isPrijsopgave: z.boolean()
  })
  .superRefine((data, ctx) => {
    // GeldigTot >= datum
    if (
      isGeldigeDatumString(data.datum) &&
      isGeldigeDatumString(data.geldigTot) &&
      new Date(data.geldigTot) < new Date(data.datum)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['geldigTot'],
        message: 'Geldigheidsdatum moet op of na de offertedatum zijn'
      })
    }

    valideerReistijd(data.reistijd, ctx)
  })

export type OfferteFormValues = z.input<typeof OfferteFormSchema>
export type OfferteFormOutput = z.output<typeof OfferteFormSchema>

// Re-export voor consistente patroon met FactuurFormulier
export type { RegelFormValues } from '@renderer/components/document-form'
