//src/renderer/src/pages/Transacties/transactieFormSchema.ts

import { z } from 'zod'
import { isGeldigeDatumString } from '@renderer/utils/datum'

export const TransactieFormSchema = z.object({
  type: z.enum(['inkomst', 'uitgave']),
  omschrijving: z.string().trim().min(1, 'Omschrijving is verplicht').max(500, 'Max 500 tekens'),
  bedrag: z
    .string()
    .min(1, 'Bedrag is verplicht')
    .refine((v) => !isNaN(parseFloat(v)), 'Geen geldig getal')
    .refine((v) => parseFloat(v) > 0, 'Bedrag moet groter zijn dan 0')
    .refine((v) => parseFloat(v) <= 1_000_000, 'Bedrag te hoog (max €1.000.000)'),
  invoerwijze: z.enum(['exclusief', 'inclusief']),
  btwTariefId: z
    .string()
    .min(1, 'Kies een BTW-tarief')
    .refine((v) => /^\d+$/.test(v), 'Ongeldig'),
  datum: z.string().min(1, 'Datum is verplicht').refine(isGeldigeDatumString, 'Ongeldige datum'),
  categorie: z.string().trim().max(100, 'Max 100 tekens')
})

export type TransactieFormValues = z.infer<typeof TransactieFormSchema>
