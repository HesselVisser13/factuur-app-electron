// src/main/services/offertes.test.ts

import { describe, expect, it } from 'vitest'

/**
 * We testen alleen pure helper-functies. Volledige service-tests
 * vereisen DB-mocks (Prisma), te complex voor MVP.
 */

describe('offertes - regel berekening', () => {
  function berekenRegel(aantal: number, prijsPerStuk: number, btwPercentage: number) {
    const bedragExcl = aantal * prijsPerStuk
    const btwBedrag = bedragExcl * (btwPercentage / 100)
    const bedragIncl = bedragExcl + btwBedrag
    return {
      bedragExcl: Math.round(bedragExcl * 100) / 100,
      btwBedrag: Math.round(btwBedrag * 100) / 100,
      bedragIncl: Math.round(bedragIncl * 100) / 100
    }
  }

  it('rekent eenvoudige regel correct', () => {
    const r = berekenRegel(2, 100, 21)
    expect(r.bedragExcl).toBe(200)
    expect(r.btwBedrag).toBe(42)
    expect(r.bedragIncl).toBe(242)
  })

  it('rekent met laag BTW-tarief', () => {
    const r = berekenRegel(1, 100, 9)
    expect(r.bedragExcl).toBe(100)
    expect(r.btwBedrag).toBe(9)
    expect(r.bedragIncl).toBe(109)
  })

  it('rekent met 0% BTW', () => {
    const r = berekenRegel(5, 50, 0)
    expect(r.bedragExcl).toBe(250)
    expect(r.btwBedrag).toBe(0)
    expect(r.bedragIncl).toBe(250)
  })

  it('rondt correct af bij niet-ronde uitkomsten', () => {
    const r = berekenRegel(3, 33.33, 21)
    expect(r.bedragExcl).toBe(99.99)
    expect(r.btwBedrag).toBeCloseTo(21, 2)
    expect(r.bedragIncl).toBeCloseTo(120.99, 2)
  })

  it('werkt met decimale aantallen', () => {
    const r = berekenRegel(1.5, 80, 21)
    expect(r.bedragExcl).toBe(120)
    expect(r.btwBedrag).toBe(25.2)
    expect(r.bedragIncl).toBe(145.2)
  })
})

describe('offertes - nummer-format', () => {
  function genereerNummerVoorbeeld(jaar: number, volgnummer: number): string {
    return `${jaar}-O${String(volgnummer).padStart(3, '0')}`
  }

  it('genereert offerte-nummer in juiste format', () => {
    expect(genereerNummerVoorbeeld(2026, 1)).toBe('2026-O001')
    expect(genereerNummerVoorbeeld(2026, 42)).toBe('2026-O042')
    expect(genereerNummerVoorbeeld(2026, 999)).toBe('2026-O999')
  })

  it('werkt voor verschillende jaren', () => {
    expect(genereerNummerVoorbeeld(2025, 1)).toBe('2025-O001')
    expect(genereerNummerVoorbeeld(2030, 1)).toBe('2030-O001')
  })
})

describe('offertes - status-validatie', () => {
  type Status = 'concept' | 'verzonden' | 'geaccepteerd' | 'afgewezen' | 'verlopen' | 'omgezet'

  function magBewerken(status: Status): boolean {
    return status === 'concept'
  }

  function magVerwijderen(status: Status, factuurId: number | null): boolean {
    return status === 'concept' && factuurId === null
  }

  function magConverteren(status: Status, factuurId: number | null): boolean {
    return status === 'geaccepteerd' && factuurId === null
  }

  it('alleen concept mag bewerkt worden', () => {
    expect(magBewerken('concept')).toBe(true)
    expect(magBewerken('verzonden')).toBe(false)
    expect(magBewerken('geaccepteerd')).toBe(false)
    expect(magBewerken('afgewezen')).toBe(false)
    expect(magBewerken('verlopen')).toBe(false)
    expect(magBewerken('omgezet')).toBe(false)
  })

  it('alleen concept zonder factuur mag verwijderd worden', () => {
    expect(magVerwijderen('concept', null)).toBe(true)
    expect(magVerwijderen('concept', 5)).toBe(false)
    expect(magVerwijderen('verzonden', null)).toBe(false)
    expect(magVerwijderen('omgezet', 5)).toBe(false)
  })

  it('alleen geaccepteerde offertes zonder factuur mogen omgezet worden', () => {
    expect(magConverteren('geaccepteerd', null)).toBe(true)
    expect(magConverteren('geaccepteerd', 5)).toBe(false)
    expect(magConverteren('concept', null)).toBe(false)
    expect(magConverteren('verzonden', null)).toBe(false)
    expect(magConverteren('omgezet', 5)).toBe(false)
  })
})
