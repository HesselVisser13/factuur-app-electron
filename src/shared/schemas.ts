// src/shared/schemas.ts

import { z } from 'zod'

export const TransactieInputSchema = z.object({
  type: z.enum(['inkomst', 'uitgave']),
  omschrijving: z.string().min(1, 'Omschrijving is verplicht'),
  bedrag: z.number().positive('Bedrag moet positief zijn'),
  invoerwijze: z.enum(['exclusief', 'inclusief']),
  btwTariefId: z.number().int().positive(),
  btwPercentage: z.number().min(0).max(100),
  datum: z.string().min(1, 'Datum is verplicht'),
  categorie: z.string().optional(),
  notitie: z.string().optional()
})

export const InstellingenSchema = z.record(z.string(), z.string())

export const PeriodeSchema = z.object({
  van: z.string().datetime({ offset: true }).or(z.string().min(10)),
  tot: z.string().datetime({ offset: true }).or(z.string().min(10))
})

export const KwartaalSchema = z.object({
  kwartaal: z.number().int().min(1).max(4),
  jaar: z.number().int().min(2020).max(2100)
})

export type TransactieInput = z.infer<typeof TransactieInputSchema>
export type Periode = z.infer<typeof PeriodeSchema>
export type Kwartaal = z.infer<typeof KwartaalSchema>
