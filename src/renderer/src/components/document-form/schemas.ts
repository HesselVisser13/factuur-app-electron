// src/renderer/src/components/document-form/schemas.ts

import { z } from 'zod'

import { isGeldigeDatumString } from '@renderer/utils/datum'

// ============================================================
// Building blocks
// ============================================================

export const datumString = z
  .string()
  .min(1, 'Verplicht')
  .refine(isGeldigeDatumString, 'Ongeldige datum')

const aantalString = (max = 10_000) =>
  z
    .string()
    .min(1, 'Vereist')
    .refine((v) => !isNaN(parseFloat(v.replace(',', '.'))), 'Geen geldig getal')
    .refine((v) => parseFloat(v.replace(',', '.')) > 0, 'Aantal moet groter zijn dan 0')
    .refine(
      (v) => parseFloat(v.replace(',', '.')) <= max,
      `Aantal max ${max.toLocaleString('nl-NL')}`
    )
    .refine((v) => {
      // Alleen hele of halve getallen (1, 1.5, 2, 2.5, etc.)
      const num = parseFloat(v.replace(',', '.'))
      return (num * 2) % 1 === 0
    }, 'Alleen hele of halve waarden toegestaan (bv. 1, 1,5, 2)')

const decimalNumberString = (label = 'Bedrag', max = 1_000_000) =>
  z
    .string()
    .min(1, 'Vereist')
    .refine((v) => !isNaN(parseFloat(v)), 'Geen geldig getal')
    .refine((v) => parseFloat(v) >= 0, `${label} niet negatief`)
    .refine((v) => parseFloat(v) <= max, `${label} te hoog`)

// ============================================================
// Sub-schemas
// ============================================================

export const RegelFormSchema = z.object({
  _uid: z.string(),
  datum: datumString,
  omschrijving: z.string().trim().min(1, 'Verplicht').max(500, 'Max 500 tekens'),
  aantal: aantalString(10_000),
  prijsPerStuk: decimalNumberString('Prijs', 1_000_000),
  btwTariefId: z.number().int().positive('Kies tarief'),
  btwPercentage: z.number().min(0).max(100)
})

export const ReistijdBaseSchema = z.object({
  enabled: z.boolean(),
  uren: z.string(),
  km: z.string(),
  omschrijving: z.string(),
  btwTariefId: z.number().int().positive().nullable(),
  btwPercentage: z.number()
})

// ============================================================
// Document base shape
// ============================================================

/**
 * Gedeelde validatie-velden voor alle document-formulieren.
 * Wordt uitgebreid in factuurFormSchema en offerteFormSchema.
 */
export const documentBaseFields = {
  klantId: z
    .number()
    .int()
    .positive('Kies een klant')
    .nullable()
    .refine((v) => v !== null, { message: 'Kies een klant' }),
  datum: datumString,
  referentie: z.string().trim().max(100, 'Max 100 tekens'),
  opmerkingen: z.string().trim().max(1000, 'Max 1000 tekens'),
  regels: z.array(RegelFormSchema).min(1, 'Voeg minstens één regel toe'),
  reistijd: ReistijdBaseSchema
}

// ============================================================
// Reistijd-validatie helper (voor superRefine)
// ============================================================

type ReistijdData = z.infer<typeof ReistijdBaseSchema>

/**
 * Validatie van reistijd-velden binnen een form-schema.
 * Aanroep in superRefine() van het form-schema.
 */
export function valideerReistijd(reistijd: ReistijdData, ctx: z.RefinementCtx): void {
  if (!reistijd.enabled) return

  if (!reistijd.uren) {
    ctx.addIssue({
      code: 'custom',
      path: ['reistijd', 'uren'],
      message: 'Reistijd is verplicht'
    })
  } else {
    const uren = parseFloat(reistijd.uren)
    if (isNaN(uren))
      ctx.addIssue({ code: 'custom', path: ['reistijd', 'uren'], message: 'Geen geldig getal' })
    else if (uren < 0.5)
      ctx.addIssue({ code: 'custom', path: ['reistijd', 'uren'], message: 'Minimaal 0,5 uur' })
    else if (uren > 24)
      ctx.addIssue({ code: 'custom', path: ['reistijd', 'uren'], message: 'Maximaal 24 uur' })
  }

  if (reistijd.km) {
    const km = parseFloat(reistijd.km)
    if (isNaN(km))
      ctx.addIssue({ code: 'custom', path: ['reistijd', 'km'], message: 'Geen geldig getal' })
    else if (km < 0)
      ctx.addIssue({ code: 'custom', path: ['reistijd', 'km'], message: 'Niet negatief' })
    else if (km > 10_000)
      ctx.addIssue({ code: 'custom', path: ['reistijd', 'km'], message: 'Maximaal 10.000 km' })
  }

  if (!reistijd.omschrijving.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['reistijd', 'omschrijving'],
      message: 'Omschrijving is verplicht'
    })
  } else if (reistijd.omschrijving.length > 200) {
    ctx.addIssue({
      code: 'custom',
      path: ['reistijd', 'omschrijving'],
      message: 'Maximaal 200 tekens'
    })
  }

  if (!reistijd.btwTariefId) {
    ctx.addIssue({
      code: 'custom',
      path: ['reistijd', 'btwTariefId'],
      message: 'Kies een BTW-tarief'
    })
  }
}

export type RegelFormSchemaType = z.infer<typeof RegelFormSchema>
