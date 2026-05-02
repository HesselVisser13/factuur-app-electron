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

// TransactieUpdate = TransactieInput + id
export const TransactieUpdateSchema = TransactieInputSchema.extend({
  id: z.number().int().positive()
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

const klantBaseSchema = {
  aanhef: z.string().optional(),
  voornaam: z.string().optional(),
  achternaam: z.string().optional(),
  adres: z.string().optional(),
  postcode: z.string().optional(),
  plaats: z.string().optional(),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  telefoon: z.string().optional()
}

export const KlantInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('particulier'),
    ...klantBaseSchema,
    achternaam: z.string().min(1, 'Achternaam is verplicht'),
    bedrijfsnaam: z.string().optional(),
    kvkNummer: z.string().optional(),
    btwNummer: z.string().optional()
  }),
  z.object({
    type: z.literal('zakelijk'),
    ...klantBaseSchema,
    bedrijfsnaam: z.string().min(1, 'Bedrijfsnaam is verplicht'),
    kvkNummer: z.string().optional(),
    btwNummer: z.string().optional()
  })
])

export const KlantUpdateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('particulier'),
    id: z.number().int().positive(),
    ...klantBaseSchema,
    achternaam: z.string().min(1, 'Achternaam is verplicht'),
    bedrijfsnaam: z.string().optional(),
    kvkNummer: z.string().optional(),
    btwNummer: z.string().optional()
  }),
  z.object({
    type: z.literal('zakelijk'),
    id: z.number().int().positive(),
    ...klantBaseSchema,
    bedrijfsnaam: z.string().min(1, 'Bedrijfsnaam is verplicht'),
    kvkNummer: z.string().optional(),
    btwNummer: z.string().optional()
  })
])

export type TransactieInput = z.infer<typeof TransactieInputSchema>
export type TransactieUpdate = z.infer<typeof TransactieUpdateSchema>
export type Periode = z.infer<typeof PeriodeSchema>
export type Kwartaal = z.infer<typeof KwartaalSchema>
export type KlantInput = z.infer<typeof KlantInputSchema>
export type KlantUpdate = z.infer<typeof KlantUpdateSchema>
