// src/renderer/src/pages/Instellingen/instellingenFormSchema.ts

import { z } from 'zod'

const optionalRegex = (regex: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || regex.test(v), message)

// IBAN: complex genoeg om apart te valideren
const ibanField = z
  .string()
  .trim()
  .refine((value) => {
    if (value === '') return true
    const stripped = value.replace(/\s/g, '').toUpperCase()
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(stripped)) return false
    if (stripped.length < 15 || stripped.length > 34) return false
    if (stripped.startsWith('NL') && stripped.length !== 18) return false
    return true
  }, 'Ongeldig IBAN (bv. NL91ABNA0417164300, 18 tekens voor NL)')

const websiteField = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^(https?:\/\/|www\.)/i.test(v),
    'Website moet beginnen met http://, https:// of www.'
  )

const telefoonField = z
  .string()
  .trim()
  .refine((v) => {
    if (v === '') return true
    if (!/^[\d\s+\-()]+$/.test(v)) return false
    return v.length >= 8 && v.length <= 20
  }, 'Ongeldig telefoonnummer (8-20 tekens, alleen cijfers en + - ( ))')

const positiefBedragField = (label: string, max = 1000) =>
  z
    .string()
    .trim()
    .refine(
      (v) => {
        if (v === '') return true
        const n = parseFloat(v)
        return !isNaN(n) && n >= 0 && n <= max
      },
      `${label} moet tussen 0 en ${max.toLocaleString('nl-NL')} zijn`
    )

const betaaltermijnField = z
  .string()
  .min(1, 'Betaaltermijn is verplicht')
  .refine((v) => /^\d+$/.test(v), 'Geen geldig getal')
  .refine((v) => {
    const n = parseInt(v, 10)
    return n >= 1 && n <= 90
  }, 'Tussen 1 en 90 dagen')

export const InstellingenFormSchema = z.object({
  // Bedrijfsgegevens
  bedrijfsnaam: z.string().trim().max(200, 'Max 200 tekens'),
  eigenaar_naam: z.string().trim().max(100, 'Max 100 tekens'),
  telefoon: telefoonField,
  email: optionalRegex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ongeldig e-mailadres'),
  website: websiteField,

  // Adres
  adres: z.string().trim().max(200, 'Max 200 tekens'),
  postcode: optionalRegex(/^\d{4}\s?[A-Za-z]{2}$/, 'Postcode moet zijn als 1234 AB'),
  plaats: z.string().trim().max(100, 'Max 100 tekens'),

  // Financieel
  kvk_nummer: optionalRegex(/^\d{8}$/, 'KvK-nummer moet exact 8 cijfers zijn'),
  btw_nummer: optionalRegex(/^NL\d{9}B\d{2}$/i, 'BTW-nummer moet zijn als NL123456789B01'),
  banknaam: z.string().trim().max(100),
  iban: ibanField,
  bic: optionalRegex(
    /^[A-Z0-9]{8}([A-Z0-9]{3})?$/i,
    'BIC moet 8 of 11 tekens zijn (alleen letters/cijfers)'
  ),
  betaaltermijn_dagen: betaaltermijnField,
  is_starter: z.enum(['true', 'false']),

  // Logo
  logo_filename: z.string(),

  // Factuur
  factuur_voorwaarden: z.string().trim().max(1000, 'Maximaal 1000 tekens'),

  // Reiskosten
  reiskosten_uurtarief: positiefBedragField('Uurtarief'),
  reiskosten_kmtarief: positiefBedragField('Km-tarief'),
  reiskosten_btw_tarief_id: z.string(),
  reiskosten_omschrijving: z.string().trim().max(200, 'Maximaal 200 tekens')
})

export type InstellingenFormValues = z.infer<typeof InstellingenFormSchema>
