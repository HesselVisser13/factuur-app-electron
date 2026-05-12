// src/renderer/src/pages/Facturen/mailFormSchema.ts

import { z } from 'zod'

export const MailFormSchema = z.object({
  ontvanger: z.email({ message: 'Ongeldig e-mailadres' }).max(200, 'E-mail te lang'),
  onderwerp: z
    .string()
    .trim()
    .min(1, 'Onderwerp is verplicht')
    .max(200, 'Onderwerp te lang (max 200 tekens)'),
  body: z
    .string()
    .trim()
    .min(1, 'Bericht mag niet leeg zijn')
    .max(2000, 'Bericht te lang (max 2000 tekens)')
})

export type MailFormValues = z.infer<typeof MailFormSchema>
