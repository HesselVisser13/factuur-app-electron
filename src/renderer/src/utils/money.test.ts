import { describe, expect, it } from 'vitest'

import {
  type Cents,
  btwInCents,
  centsToEuro,
  euroToCents,
  formatCents,
  multiplyCents,
  parseEuroString,
  sumCents
} from './money'

/** Helper: cast raw number naar Cents (alleen voor tests) */
const c = (n: number): Cents => n as Cents

// ============================================================
// parseEuroString
// ============================================================

describe('parseEuroString', () => {
  it('parseert standaard formaat', () => {
    expect(parseEuroString('100.50')).toBe(c(10_050))
  })

  it('parseert komma als decimaalteken (NL-formaat)', () => {
    expect(parseEuroString('100,50')).toBe(c(10_050))
  })

  it('parseert geheel getal', () => {
    expect(parseEuroString('100')).toBe(c(10_000))
  })

  it('lege string → 0', () => {
    expect(parseEuroString('')).toBe(c(0))
  })

  it('ongeldige input → 0', () => {
    expect(parseEuroString('abc')).toBe(c(0))
  })

  it('negatieve waarde wordt gerespecteerd', () => {
    expect(parseEuroString('-50')).toBe(c(-5_000))
  })

  it('rondt op cents af (round-half-up)', () => {
    expect(parseEuroString('100.555')).toBe(c(10_056))
  })

  it('handelt whitespace af', () => {
    expect(parseEuroString('  99.99  ')).toBe(c(9_999))
  })
})

// ============================================================
// euroToCents / centsToEuro
// ============================================================

describe('euroToCents / centsToEuro', () => {
  it('roundtrip behoudt waarde', () => {
    const cents = euroToCents(123.45)
    expect(cents).toBe(c(12_345))
    expect(centsToEuro(cents)).toBe(123.45)
  })

  it('voorkomt float-issues bij conversie', () => {
    // Klassieker: 0.1 + 0.2 = 0.30000000000000004 in floats
    expect(euroToCents(0.1 + 0.2)).toBe(c(30))
  })

  it('rondt af op hele cents', () => {
    expect(euroToCents(99.999)).toBe(c(10_000))
    expect(euroToCents(99.994)).toBe(c(9_999))
  })

  it('handelt 0 correct af', () => {
    expect(euroToCents(0)).toBe(c(0))
    expect(centsToEuro(c(0))).toBe(0)
  })

  it('handelt negatieve waarden correct af', () => {
    expect(euroToCents(-50.25)).toBe(c(-5_025))
    expect(centsToEuro(c(-5_025))).toBe(-50.25)
  })
})

// ============================================================
// btwInCents
// ============================================================

describe('btwInCents', () => {
  it('berekent 21% BTW commercieel afgerond', () => {
    expect(btwInCents(euroToCents(100), 21)).toBe(c(2_100))
  })

  it('rondt half-up af', () => {
    // 994 cents × 21 / 100 = 208.74 → 209
    expect(btwInCents(euroToCents(9.94), 21)).toBe(c(209))
  })

  it('rondt naar boven bij .5', () => {
    // 50 cents × 21 / 100 = 10.5 → 11
    expect(btwInCents(c(50), 21)).toBe(c(11))
  })

  it('0% geeft 0', () => {
    expect(btwInCents(euroToCents(100), 0)).toBe(c(0))
  })

  it('9% laag tarief', () => {
    expect(btwInCents(euroToCents(100), 9)).toBe(c(900))
  })

  it('handelt 0 cents correct af', () => {
    expect(btwInCents(c(0), 21)).toBe(c(0))
  })
})

// ============================================================
// sumCents
// ============================================================

describe('sumCents', () => {
  it('telt cents correct op zonder rounding-fouten', () => {
    expect(sumCents([c(100), c(200), c(300)])).toBe(c(600))
  })

  it('lege array → 0', () => {
    expect(sumCents([])).toBe(c(0))
  })

  it('werkt met negatieve waarden', () => {
    expect(sumCents([c(100), c(-50)])).toBe(c(50))
  })

  it('💰 voorkomt float-rounding bug bij veel optellingen', () => {
    // Klassieker: 0.1 + 0.2 + 0.3 ≠ 0.6 in floats
    // In cents: 10 + 20 + 30 = 60 (precies)
    const cents = Array.from({ length: 100 }, () => c(10))
    expect(sumCents(cents)).toBe(c(1_000))
  })
})

// ============================================================
// multiplyCents
// ============================================================

describe('multiplyCents', () => {
  it('vermenigvuldigt en rondt af', () => {
    // €1,42 × 7 = €9,94 = 994 cents
    expect(multiplyCents(euroToCents(1.42), 7)).toBe(c(994))
  })

  it('handelt decimale factor af', () => {
    // €55 × 1.5 = €82,50 = 8250 cents
    expect(multiplyCents(euroToCents(55), 1.5)).toBe(c(8_250))
  })

  it('vermenigvuldigt met 0', () => {
    expect(multiplyCents(euroToCents(100), 0)).toBe(c(0))
  })

  it('rondt half-up af', () => {
    // 100 cents × 1.005 = 100.5 → 101
    expect(multiplyCents(c(100), 1.005)).toBe(c(101))
  })
})

// ============================================================
// formatCents
// ============================================================

describe('formatCents', () => {
  it('formatteert in NL-locale', () => {
    const result = formatCents(euroToCents(1234.56))
    // Bevat "1.234,56" en € — exacte spaties verschillen per Node-versie/ICU
    expect(result).toMatch(/1[.\u00a0]234,56/)
    expect(result).toContain('€')
  })

  it('formatteert nul correct', () => {
    expect(formatCents(c(0))).toMatch(/0,00/)
  })

  it('formatteert negatief bedrag correct', () => {
    const result = formatCents(c(-12_345))
    expect(result).toMatch(/-?\s*€?\s*-?123,45/)
  })

  it('formatteert grote bedragen met thousand-separators', () => {
    const result = formatCents(euroToCents(1_000_000))
    expect(result).toMatch(/1[.\u00a0]000[.\u00a0]000,00/)
  })
})
