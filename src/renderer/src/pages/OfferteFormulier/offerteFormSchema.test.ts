// src/renderer/src/pages/OfferteFormulier/offerteFormSchema.test.ts

import { describe, expect, it } from 'vitest'

import { OfferteFormSchema, type OfferteFormValues } from './offerteFormSchema'

const validInput: OfferteFormValues = {
  klantId: 1,
  datum: '2026-06-01',
  geldigTot: '2026-06-30',
  referentie: '',
  opmerkingen: '',
  toonAkkoordBlok: false,
  isPrijsopgave: false,
  regels: [
    {
      _uid: 'test',
      datum: '2026-06-01',
      omschrijving: 'Test product',
      aantal: '1',
      prijsPerStuk: '100',
      btwTariefId: 1,
      btwPercentage: 21
    }
  ],
  reistijd: {
    enabled: false,
    uren: '',
    km: '',
    omschrijving: '',
    btwTariefId: null,
    btwPercentage: 0
  }
}

describe('OfferteFormSchema', () => {
  it('accepteert geldige offerte', () => {
    const result = OfferteFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('vereist klantId', () => {
    const result = OfferteFormSchema.safeParse({ ...validInput, klantId: null })
    expect(result.success).toBe(false)
  })

  it('vereist minstens één regel', () => {
    const result = OfferteFormSchema.safeParse({ ...validInput, regels: [] })
    expect(result.success).toBe(false)
  })

  it('weigert geldigTot vóór datum', () => {
    const result = OfferteFormSchema.safeParse({
      ...validInput,
      datum: '2026-06-30',
      geldigTot: '2026-06-01'
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('geldigTot'))).toBe(true)
    }
  })

  it('accepteert geldigTot gelijk aan datum', () => {
    const result = OfferteFormSchema.safeParse({
      ...validInput,
      datum: '2026-06-15',
      geldigTot: '2026-06-15'
    })
    expect(result.success).toBe(true)
  })

  it('vereist reistijd-velden als enabled=true', () => {
    const result = OfferteFormSchema.safeParse({
      ...validInput,
      reistijd: {
        enabled: true,
        uren: '',
        km: '',
        omschrijving: '',
        btwTariefId: null,
        btwPercentage: 0
      }
    })
    expect(result.success).toBe(false)
  })

  it('accepteert geldige reistijd', () => {
    const result = OfferteFormSchema.safeParse({
      ...validInput,
      reistijd: {
        enabled: true,
        uren: '2',
        km: '50',
        omschrijving: 'Reistijd',
        btwTariefId: 1,
        btwPercentage: 21
      }
    })
    expect(result.success).toBe(true)
  })

  it('accepteert toonAkkoordBlok=true', () => {
    const result = OfferteFormSchema.safeParse({ ...validInput, toonAkkoordBlok: true })
    expect(result.success).toBe(true)
  })
})
