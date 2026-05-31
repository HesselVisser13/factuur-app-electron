// src/shared/schemas.ts

import { z } from 'zod'

// ============================================================
// Helpers — herbruikbare validators
// ============================================================

const datumSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn')
  .refine((v) => !isNaN(new Date(v).getTime()), 'Ongeldige datum')

const optionalString = (max: number = 200) =>
  z.string().trim().max(max, `Maximaal ${max} tekens`).optional().or(z.literal(''))

const postcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}\s?[A-Za-z]{2}$/, 'Postcode moet zijn als 1234 AB')
  .optional()
  .or(z.literal(''))

const telefoonSchema = z
  .string()
  .trim()
  .regex(/^[\d\s+\-()]+$/, 'Telefoonnummer mag alleen cijfers en + - ( ) bevatten')
  .min(8, 'Telefoonnummer te kort')
  .max(20, 'Telefoonnummer te lang')
  .optional()
  .or(z.literal(''))

const emailSchema = z
  .string()
  .trim()
  .email('Ongeldig e-mailadres')
  .max(200, 'E-mail te lang')
  .optional()
  .or(z.literal(''))

const kvkSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, 'KvK-nummer moet exact 8 cijfers zijn')
  .optional()
  .or(z.literal(''))

const btwNummerSchema = z
  .string()
  .trim()
  .regex(/^NL\d{9}B\d{2}$/i, 'BTW-nummer moet zijn als NL123456789B01')
  .optional()
  .or(z.literal(''))

// Bedragen: max €1 miljoen per regel, redelijke ondergrens
const bedragSchema = z
  .number()
  .nonnegative('Bedrag mag niet negatief zijn')
  .max(1_000_000, 'Bedrag te hoog (max €1.000.000)')

const positiefBedragSchema = z
  .number()
  .positive('Bedrag moet groter zijn dan 0')
  .max(1_000_000, 'Bedrag te hoog (max €1.000.000)')

// ============================================================
// TRANSACTIES
// ============================================================

export const TransactieInputSchema = z.object({
  type: z.enum(['inkomst', 'uitgave']),
  omschrijving: z
    .string()
    .trim()
    .min(1, 'Omschrijving is verplicht')
    .max(500, 'Omschrijving te lang (max 500 tekens)'),
  bedrag: positiefBedragSchema,
  invoerwijze: z.enum(['exclusief', 'inclusief']),
  btwTariefId: z.number().int().positive(),
  btwPercentage: z.number().min(0, 'BTW kan niet negatief zijn').max(100, 'BTW max 100%'),
  datum: datumSchema,
  categorie: optionalString(100),
  notitie: optionalString(1000)
})

export const TransactieUpdateSchema = TransactieInputSchema.extend({
  id: z.number().int().positive()
})

// ============================================================
// INSTELLINGEN
// ============================================================

export const InstellingenSchema = z.record(z.string(), z.string())

// ============================================================
// PERIODE / KWARTAAL
// ============================================================

export const PeriodeSchema = z
  .object({
    van: datumSchema,
    tot: datumSchema
  })
  .refine((data) => new Date(data.tot) >= new Date(data.van), {
    message: 'Eind-datum moet op of na start-datum zijn',
    path: ['tot']
  })

export const KwartaalSchema = z.object({
  kwartaal: z.number().int().min(1, 'Kwartaal 1-4').max(4, 'Kwartaal 1-4'),
  jaar: z
    .number()
    .int()
    .min(2020, 'Jaar moet 2020 of later zijn')
    .max(2100, 'Jaar te ver in toekomst')
})

// ============================================================
// KLANTEN
// ============================================================

const klantBaseSchema = {
  aanhef: optionalString(20),
  voornaam: optionalString(100),
  achternaam: optionalString(100),
  adres: optionalString(200),
  postcode: postcodeSchema,
  plaats: optionalString(100),
  email: emailSchema,
  telefoon: telefoonSchema
}

export const KlantInputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('particulier'),
    ...klantBaseSchema,
    achternaam: z.string().trim().min(1, 'Achternaam is verplicht').max(100, 'Achternaam te lang'),
    bedrijfsnaam: optionalString(200),
    kvkNummer: kvkSchema,
    btwNummer: btwNummerSchema
  }),
  z.object({
    type: z.literal('zakelijk'),
    ...klantBaseSchema,
    bedrijfsnaam: z
      .string()
      .trim()
      .min(1, 'Bedrijfsnaam is verplicht')
      .max(200, 'Bedrijfsnaam te lang'),
    kvkNummer: kvkSchema,
    btwNummer: btwNummerSchema
  })
])

export const KlantUpdateSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('particulier'),
    id: z.number().int().positive(),
    ...klantBaseSchema,
    achternaam: z.string().trim().min(1, 'Achternaam is verplicht').max(100, 'Achternaam te lang'),
    bedrijfsnaam: optionalString(200),
    kvkNummer: kvkSchema,
    btwNummer: btwNummerSchema
  }),
  z.object({
    type: z.literal('zakelijk'),
    id: z.number().int().positive(),
    ...klantBaseSchema,
    bedrijfsnaam: z
      .string()
      .trim()
      .min(1, 'Bedrijfsnaam is verplicht')
      .max(200, 'Bedrijfsnaam te lang'),
    kvkNummer: kvkSchema,
    btwNummer: btwNummerSchema
  })
])

// ============================================================
// FACTUREN
// ============================================================

export const FactuurStatusSchema = z.enum(['concept', 'verstuurd', 'betaald', 'geannuleerd'])
export type FactuurStatus = z.infer<typeof FactuurStatusSchema>

export const FactuurRegelInputSchema = z.object({
  datum: datumSchema,
  omschrijving: z
    .string()
    .trim()
    .min(1, 'Omschrijving is verplicht')
    .max(500, 'Omschrijving te lang (max 500 tekens)'),
  aantal: z
    .number()
    .int('Aantal moet een heel getal zijn')
    .positive('Aantal moet groter zijn dan 0')
    .max(10_000, 'Aantal te hoog (max 10.000)'),
  prijsPerStuk: bedragSchema,
  btwTariefId: z.number().int().positive(),
  btwPercentage: z.number().min(0, 'BTW kan niet negatief zijn').max(100, 'BTW max 100%')
})

export const ReistijdInputSchema = z.object({
  uren: z
    .number()
    .min(0.5, 'Reistijd moet minstens 0,5 uur zijn')
    .max(24, 'Reistijd kan maximaal 24 uur zijn'),
  km: z
    .number()
    .nonnegative('Kilometers kunnen niet negatief zijn')
    .max(10_000, 'Kilometers te hoog (max 10.000)')
    .nullable()
    .optional(),
  btwTariefId: z.number().int().positive(),
  btwPercentage: z.number().min(0).max(100),
  omschrijving: z
    .string()
    .trim()
    .min(1, 'Omschrijving is verplicht')
    .max(200, 'Omschrijving te lang (max 200 tekens)')
})

export const FactuurInputSchema = z
  .object({
    klantId: z.number().int().positive('Kies een klant'),
    datum: datumSchema,
    vervalDatum: datumSchema,
    referentie: optionalString(100),
    opmerkingen: optionalString(1000),
    regels: z
      .array(FactuurRegelInputSchema)
      .min(1, 'Voeg minstens één regel toe')
      .max(100, 'Maximaal 100 regels per factuur'),
    reistijd: ReistijdInputSchema.nullable().optional()
  })
  .refine((data) => new Date(data.vervalDatum) >= new Date(data.datum), {
    message: 'Vervaldatum moet op of na de factuurdatum zijn',
    path: ['vervalDatum']
  })

// .extend werkt niet direct op een ZodEffects (die door .refine() ontstaat),
// dus we definiëren FactuurUpdateSchema apart met dezelfde rules.
export const FactuurUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    klantId: z.number().int().positive('Kies een klant'),
    datum: datumSchema,
    vervalDatum: datumSchema,
    referentie: optionalString(100),
    opmerkingen: optionalString(1000),
    regels: z
      .array(FactuurRegelInputSchema)
      .min(1, 'Voeg minstens één regel toe')
      .max(100, 'Maximaal 100 regels per factuur'),
    reistijd: ReistijdInputSchema.nullable().optional()
  })
  .refine((data) => new Date(data.vervalDatum) >= new Date(data.datum), {
    message: 'Vervaldatum moet op of na de factuurdatum zijn',
    path: ['vervalDatum']
  })

export const FactuurStatusUpdateSchema = z.object({
  id: z.number().int().positive(),
  status: FactuurStatusSchema
})

// ============================================================
// BTW-tarief schemas
// ============================================================

export const BtwTariefInputSchema = z.object({
  naam: z.string().trim().min(1, 'Naam is verplicht').max(50, 'Max 50 tekens'),
  percentage: z
    .number()
    .min(0, 'Percentage moet 0 of hoger zijn')
    .max(100, 'Percentage moet 100 of lager zijn')
})

export const BtwTariefUpdateSchema = BtwTariefInputSchema.extend({
  id: z.number().int().positive()
})

// ============================================================
// Belasting / IB-schatting
// ============================================================

export const BelastingInputSchema = z.object({
  jaar: z.number().int().min(2020).max(2100),
  /** Voldoet aan urencriterium >1.225u/jaar */
  voldoetUrencriterium: z.boolean(),
  /** Eerste 3 jaar als ondernemer */
  isStarter: z.boolean(),
  /** Bruto loon-inkomen uit andere bron (werkgever, etc.) per jaar */
  loonInkomen: z.number().min(0),
  /** Bedrag al gereserveerd (handmatig getrackt) */
  alGereserveerd: z.number().min(0).optional()
})

// ============================================================
// Investering calculator
// ============================================================

export const InvesteringInputSchema = z.object({
  bedrag: z.number().min(0).max(10_000_000),
  invoerwijze: z.enum(['inclusief', 'exclusief']),
  btwPercentage: z.number().min(0).max(100)
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type TransactieInput = z.infer<typeof TransactieInputSchema>
export type TransactieUpdate = z.infer<typeof TransactieUpdateSchema>
export type Periode = z.infer<typeof PeriodeSchema>
export type Kwartaal = z.infer<typeof KwartaalSchema>
export type KlantInput = z.infer<typeof KlantInputSchema>
export type KlantUpdate = z.infer<typeof KlantUpdateSchema>
export type FactuurRegelInput = z.infer<typeof FactuurRegelInputSchema>
export type FactuurInput = z.infer<typeof FactuurInputSchema>
export type FactuurUpdate = z.infer<typeof FactuurUpdateSchema>
export type FactuurStatusUpdate = z.infer<typeof FactuurStatusUpdateSchema>
export type ReistijdInput = z.infer<typeof ReistijdInputSchema>
export type BelastingInput = z.infer<typeof BelastingInputSchema>
export type BtwTariefInput = z.infer<typeof BtwTariefInputSchema>
export type BtwTariefUpdate = z.infer<typeof BtwTariefUpdateSchema>
export type InvesteringInput = z.infer<typeof InvesteringInputSchema>
