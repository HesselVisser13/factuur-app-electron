// src/renderer/src/pages/FactuurFormulier/factuurFormSchema.ts

import { z } from 'zod'
import { isGeldigeDatumString } from '@renderer/utils/datum'

const datumString = z.string().min(1, 'Verplicht').refine(isGeldigeDatumString, 'Ongeldige datum')

const wholeNumberString = (label = 'Aantal', max = 10_000) =>
  z
    .string()
    .min(1, 'Vereist')
    .regex(/^\d+$/, 'Heel getal')
    .refine((v) => parseInt(v, 10) >= 1, `${label} min 1`)
    .refine((v) => parseInt(v, 10) <= max, `${label} max ${max.toLocaleString('nl-NL')}`)

const decimalNumberString = (label = 'Bedrag', max = 1_000_000) =>
  z
    .string()
    .min(1, 'Vereist')
    .refine((v) => !isNaN(parseFloat(v)), 'Geen geldig getal')
    .refine((v) => parseFloat(v) >= 0, `${label} niet negatief`)
    .refine((v) => parseFloat(v) <= max, `${label} te hoog`)

// ============================================================
// Regel
// ============================================================

export const RegelFormSchema = z.object({
  _uid: z.string(),
  datum: datumString,
  omschrijving: z.string().trim().min(1, 'Verplicht').max(500, 'Max 500 tekens'),
  aantal: wholeNumberString('Aantal', 10_000),
  prijsPerStuk: decimalNumberString('Prijs', 1_000_000),
  btwTariefId: z.number().int().positive('Kies tarief'),
  btwPercentage: z.number().min(0).max(100)
})

// ============================================================
// Reistijd
// ============================================================

const ReistijdBaseSchema = z.object({
  enabled: z.boolean(),
  uren: z.string(),
  km: z.string(),
  omschrijving: z.string(),
  btwTariefId: z.number().int().positive().nullable(),
  btwPercentage: z.number()
})

// ============================================================
// Form
// ============================================================

export const FactuurFormSchema = z
  .object({
    klantId: z
      .number()
      .int()
      .positive('Kies een klant')
      .nullable()
      .refine((v) => v !== null, { message: 'Kies een klant' }),
    datum: datumString,
    vervalDatum: datumString,
    referentie: z.string().trim().max(100, 'Max 100 tekens'),
    opmerkingen: z.string().trim().max(1000, 'Max 1000 tekens'),
    regels: z.array(RegelFormSchema).min(1, 'Voeg minstens één factuurregel toe'),
    reistijd: ReistijdBaseSchema
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

    // Reistijd alleen valideren als enabled
    if (data.reistijd.enabled) {
      if (!data.reistijd.uren) {
        ctx.addIssue({
          code: 'custom',
          path: ['reistijd', 'uren'],
          message: 'Reistijd is verplicht'
        })
      } else {
        const uren = parseFloat(data.reistijd.uren)
        if (isNaN(uren))
          ctx.addIssue({
            code: 'custom',
            path: ['reistijd', 'uren'],
            message: 'Geen geldig getal'
          })
        else if (uren < 0.5)
          ctx.addIssue({
            code: 'custom',
            path: ['reistijd', 'uren'],
            message: 'Minimaal 0,5 uur'
          })
        else if (uren > 24)
          ctx.addIssue({
            code: 'custom',
            path: ['reistijd', 'uren'],
            message: 'Maximaal 24 uur'
          })
      }

      if (data.reistijd.km) {
        const km = parseFloat(data.reistijd.km)
        if (isNaN(km))
          ctx.addIssue({
            code: 'custom',
            path: ['reistijd', 'km'],
            message: 'Geen geldig getal'
          })
        else if (km < 0)
          ctx.addIssue({
            code: 'custom',
            path: ['reistijd', 'km'],
            message: 'Niet negatief'
          })
        else if (km > 10_000)
          ctx.addIssue({
            code: 'custom',
            path: ['reistijd', 'km'],
            message: 'Maximaal 10.000 km'
          })
      }

      if (!data.reistijd.omschrijving.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['reistijd', 'omschrijving'],
          message: 'Omschrijving is verplicht'
        })
      } else if (data.reistijd.omschrijving.length > 200) {
        ctx.addIssue({
          code: 'custom',
          path: ['reistijd', 'omschrijving'],
          message: 'Maximaal 200 tekens'
        })
      }

      if (!data.reistijd.btwTariefId) {
        ctx.addIssue({
          code: 'custom',
          path: ['reistijd', 'btwTariefId'],
          message: 'Kies een BTW-tarief'
        })
      }
    }
  })

// Wat in form state zit (klantId mag null zijn)
export type FactuurFormValues = z.input<typeof FactuurFormSchema>

// Wat na succesvolle validatie uitkomt (klantId is gegarandeerd number)
export type FactuurFormOutput = z.output<typeof FactuurFormSchema>

// Regel heeft geen refines, dus input === output
export type RegelFormValues = z.infer<typeof RegelFormSchema>
