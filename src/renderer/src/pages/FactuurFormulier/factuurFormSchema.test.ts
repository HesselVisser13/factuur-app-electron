import { describe, expect, it } from 'vitest'

import { FactuurFormSchema, RegelFormSchema } from './factuurFormSchema'

describe('RegelFormSchema', () => {
  const validRegel = {
    _uid: '1',
    datum: '2025-01-01',
    omschrijving: 'Test',
    aantal: '1',
    prijsPerStuk: '100',
    btwTariefId: 1,
    btwPercentage: 21
  }

  it('accepteert geldige regel', () => {
    expect(RegelFormSchema.safeParse(validRegel).success).toBe(true)
  })

  it('verwerpt lege omschrijving', () => {
    const result = RegelFormSchema.safeParse({ ...validRegel, omschrijving: '' })
    expect(result.success).toBe(false)
  })

  it('verwerpt aantal 0', () => {
    const result = RegelFormSchema.safeParse({ ...validRegel, aantal: '0' })
    expect(result.success).toBe(false)
  })

  it('verwerpt aantal > 10.000', () => {
    const result = RegelFormSchema.safeParse({ ...validRegel, aantal: '10001' })
    expect(result.success).toBe(false)
  })

  it('verwerpt negatieve prijs', () => {
    const result = RegelFormSchema.safeParse({ ...validRegel, prijsPerStuk: '-50' })
    expect(result.success).toBe(false)
  })

  it('accepteert prijs 0 (gratis regel)', () => {
    const result = RegelFormSchema.safeParse({ ...validRegel, prijsPerStuk: '0' })
    expect(result.success).toBe(true)
  })
})

describe('FactuurFormSchema', () => {
  const validForm = {
    klantId: 1,
    datum: '2025-01-01',
    vervalDatum: '2025-01-15',
    referentie: '',
    opmerkingen: '',
    regels: [
      {
        _uid: '1',
        datum: '2025-01-01',
        omschrijving: 'Test',
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

  it('accepteert geldig formulier', () => {
    expect(FactuurFormSchema.safeParse(validForm).success).toBe(true)
  })

  it('verwerpt klantId null', () => {
    const result = FactuurFormSchema.safeParse({ ...validForm, klantId: null })
    expect(result.success).toBe(false)
  })

  it('verwerpt vervaldatum vóór factuurdatum', () => {
    const result = FactuurFormSchema.safeParse({
      ...validForm,
      datum: '2025-01-15',
      vervalDatum: '2025-01-01'
    })
    expect(result.success).toBe(false)
  })

  it('verwerpt lege regels-array', () => {
    const result = FactuurFormSchema.safeParse({ ...validForm, regels: [] })
    expect(result.success).toBe(false)
  })

  it('valideert reistijd alleen als enabled', () => {
    // Disabled met lege velden → ok
    expect(FactuurFormSchema.safeParse(validForm).success).toBe(true)

    // Enabled zonder uren → niet ok
    const enabled = {
      ...validForm,
      reistijd: { ...validForm.reistijd, enabled: true }
    }
    expect(FactuurFormSchema.safeParse(enabled).success).toBe(false)
  })
})
