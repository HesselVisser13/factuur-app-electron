//src/renderer/src/pages/Klanten/klantFormSchema.ts

import { z } from 'zod'

const optionalRegex = (regex: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || regex.test(v), message)

export const KlantFormSchema = z
  .object({
    type: z.enum(['particulier', 'zakelijk']),
    bedrijfsnaam: z.string().trim().max(200, 'Max 200 tekens'),
    aanhef: z.string().trim().max(20),
    voornaam: z.string().trim().max(100, 'Max 100 tekens'),
    achternaam: z.string().trim().max(100, 'Max 100 tekens'),
    adres: z.string().trim().max(200, 'Max 200 tekens'),
    postcode: optionalRegex(/^\d{4}\s?[A-Za-z]{2}$/, 'Postcode moet zijn als 1234 AB'),
    plaats: z.string().trim().max(100, 'Max 100 tekens'),
    email: optionalRegex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ongeldig e-mailadres'),
    telefoon: z
      .string()
      .trim()
      .refine((v) => {
        if (v === '') return true
        if (!/^[\d\s+\-()]+$/.test(v)) return false
        return v.length >= 8 && v.length <= 20
      }, 'Ongeldig telefoonnummer (8-20 tekens, alleen cijfers en + - ( ))'),
    kvkNummer: optionalRegex(/^\d{8}$/, 'KvK-nummer moet exact 8 cijfers zijn'),
    btwNummer: optionalRegex(/^NL\d{9}B\d{2}$/i, 'BTW-nummer moet zijn als NL123456789B01')
  })
  .superRefine((data, ctx) => {
    if (data.type === 'zakelijk' && !data.bedrijfsnaam.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['bedrijfsnaam'],
        message: 'Bedrijfsnaam is verplicht'
      })
    }
    if (data.type === 'particulier' && !data.achternaam.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['achternaam'],
        message: 'Achternaam is verplicht'
      })
    }
  })

export type KlantFormValues = z.input<typeof KlantFormSchema>
export type KlantFormOutput = z.output<typeof KlantFormSchema>
