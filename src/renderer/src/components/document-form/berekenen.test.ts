// src/renderer/src/components/document-form/berekenen.test.ts

import { describe, expect, it } from 'vitest'

import { euroToCents } from '@renderer/utils/money'

import { berekenRegel, berekenReistijd, berekenTotalen } from './berekenen'
import type { RegelFormValues, ReistijdFormValues, ReistijdInstellingen } from './types'

// ============================================================
// Test helpers
// ============================================================

function makeRegel(overrides: Partial<RegelFormValues> = {}): RegelFormValues {
  return {
    _uid: 'test-uid',
    datum: '2025-01-01',
    omschrijving: 'Test',
    aantal: '1',
    prijsPerStuk: '100',
    btwTariefId: 1,
    btwPercentage: 21,
    ...overrides
  }
}

const reistijdLeeg: ReistijdFormValues = {
  enabled: false,
  uren: '',
  km: '',
  omschrijving: '',
  btwTariefId: null,
  btwPercentage: 0
}

const reistijdInstellingen: ReistijdInstellingen = {
  uurtarief: 55,
  kmtarief: 0.21
}

const zeroBedragen = {
  bedragExclCents: euroToCents(0),
  btwBedragCents: euroToCents(0),
  bedragInclCents: euroToCents(0)
}

// ============================================================
// berekenRegel
// ============================================================

describe('berekenRegel', () => {
  it('berekent een eenvoudige regel correct (1 × €100, 21% BTW)', () => {
    const result = berekenRegel(makeRegel({ aantal: '1', prijsPerStuk: '100' }))
    expect(result.bedragExclCents).toBe(10_000)
    expect(result.btwBedragCents).toBe(2_100)
    expect(result.bedragInclCents).toBe(12_100)
  })

  it('rondt BTW commercieel af (round-half-up)', () => {
    const result = berekenRegel(makeRegel({ aantal: '7', prijsPerStuk: '1.42', btwPercentage: 21 }))
    expect(result.bedragExclCents).toBe(994)
    expect(result.btwBedragCents).toBe(209)
    expect(result.bedragInclCents).toBe(1_203)
  })

  it('handelt 9% laag tarief correct af', () => {
    const result = berekenRegel(makeRegel({ aantal: '3', prijsPerStuk: '50', btwPercentage: 9 }))
    expect(result.bedragExclCents).toBe(15_000)
    expect(result.btwBedragCents).toBe(1_350)
    expect(result.bedragInclCents).toBe(16_350)
  })

  it('handelt 0% tarief correct af', () => {
    const result = berekenRegel(makeRegel({ aantal: '2', prijsPerStuk: '75', btwPercentage: 0 }))
    expect(result.bedragExclCents).toBe(15_000)
    expect(result.btwBedragCents).toBe(0)
    expect(result.bedragInclCents).toBe(15_000)
  })

  it('handelt lege strings af als 0', () => {
    const result = berekenRegel(makeRegel({ aantal: '', prijsPerStuk: '' }))
    expect(result.bedragExclCents).toBe(0)
    expect(result.btwBedragCents).toBe(0)
    expect(result.bedragInclCents).toBe(0)
  })

  it('handelt komma in prijs af (parseEuroString)', () => {
    const result = berekenRegel(makeRegel({ aantal: '1', prijsPerStuk: '99,99' }))
    expect(result.bedragExclCents).toBe(9_999)
  })

  it('handelt grote aantallen correct (geen integer overflow)', () => {
    const result = berekenRegel(
      makeRegel({ aantal: '1000', prijsPerStuk: '999.99', btwPercentage: 21 })
    )
    expect(result.bedragExclCents).toBe(99_999_000)
  })
})

// ============================================================
// berekenReistijd
// ============================================================

describe('berekenReistijd', () => {
  it('geeft 0 terug als reistijd uitgeschakeld', () => {
    const result = berekenReistijd(reistijdLeeg, reistijdInstellingen)
    expect(result.bedragExclCents).toBe(0)
    expect(result.btwBedragCents).toBe(0)
    expect(result.bedragInclCents).toBe(0)
  })

  it('berekent uren × uurtarief correct', () => {
    const result = berekenReistijd(
      {
        enabled: true,
        uren: '2',
        km: '',
        omschrijving: 'Reistijd',
        btwTariefId: 1,
        btwPercentage: 21
      },
      reistijdInstellingen
    )
    expect(result.bedragExclCents).toBe(11_000)
    expect(result.btwBedragCents).toBe(2_310)
    expect(result.bedragInclCents).toBe(13_310)
  })

  it('berekent uren + km gecombineerd', () => {
    const result = berekenReistijd(
      {
        enabled: true,
        uren: '1.5',
        km: '50',
        omschrijving: 'Reistijd',
        btwTariefId: 1,
        btwPercentage: 21
      },
      reistijdInstellingen
    )
    expect(result.bedragExclCents).toBe(9_300)
    expect(result.btwBedragCents).toBe(1_953)
    expect(result.bedragInclCents).toBe(11_253)
  })

  it('handelt half-uur correct af (0.5)', () => {
    const result = berekenReistijd(
      {
        enabled: true,
        uren: '0.5',
        km: '',
        omschrijving: 'Reistijd',
        btwTariefId: 1,
        btwPercentage: 21
      },
      reistijdInstellingen
    )
    expect(result.bedragExclCents).toBe(2_750)
  })
})

// ============================================================
// berekenTotalen
// ============================================================

describe('berekenTotalen', () => {
  it('telt meerdere regels van zelfde tarief op', () => {
    const regels = [
      makeRegel({ aantal: '1', prijsPerStuk: '100', btwPercentage: 21 }),
      makeRegel({ _uid: '2', aantal: '2', prijsPerStuk: '50', btwPercentage: 21 })
    ]
    const result = berekenTotalen(regels, reistijdLeeg, zeroBedragen)
    expect(result.totaalExclCents).toBe(20_000)
    expect(result.totaalBtwCents).toBe(4_200)
    expect(result.totaalInclCents).toBe(24_200)
    expect(result.perTarief).toHaveLength(1)
    expect(result.perTarief[0]).toEqual({
      percentage: 21,
      overCents: 20_000,
      btwCents: 4_200
    })
  })

  it('groepeert regels per BTW-tarief', () => {
    const regels = [
      makeRegel({ aantal: '1', prijsPerStuk: '100', btwPercentage: 21 }),
      makeRegel({ _uid: '2', aantal: '1', prijsPerStuk: '50', btwPercentage: 9 })
    ]
    const result = berekenTotalen(regels, reistijdLeeg, zeroBedragen)
    expect(result.perTarief).toHaveLength(2)
    expect(result.perTarief[0].percentage).toBe(9)
    expect(result.perTarief[1].percentage).toBe(21)
    expect(result.perTarief[0].overCents).toBe(5_000)
    expect(result.perTarief[1].overCents).toBe(10_000)
  })

  it('voegt reistijd toe aan juiste BTW-groep', () => {
    const regels = [makeRegel({ aantal: '1', prijsPerStuk: '100', btwPercentage: 21 })]
    const reistijd: ReistijdFormValues = {
      enabled: true,
      uren: '1',
      km: '',
      omschrijving: 'Reistijd',
      btwTariefId: 1,
      btwPercentage: 21
    }
    const reistijdBedrag = berekenReistijd(reistijd, reistijdInstellingen)
    const result = berekenTotalen(regels, reistijd, reistijdBedrag)

    expect(result.perTarief).toHaveLength(1)
    expect(result.perTarief[0].overCents).toBe(15_500)
    expect(result.totaalExclCents).toBe(15_500)
  })

  it('houdt reistijd in eigen BTW-groep als anders dan regels', () => {
    const regels = [makeRegel({ btwPercentage: 21 })]
    const reistijd: ReistijdFormValues = {
      enabled: true,
      uren: '1',
      km: '',
      omschrijving: 'Reistijd',
      btwTariefId: 2,
      btwPercentage: 9
    }
    const reistijdBedrag = berekenReistijd(reistijd, reistijdInstellingen)
    const result = berekenTotalen(regels, reistijd, reistijdBedrag)

    expect(result.perTarief).toHaveLength(2)
  })

  it('💰 voorkomt float-rounding bug bij veel regels (€1,42 × 7, 100 keer)', () => {
    const regels = Array.from({ length: 100 }, (_, i) =>
      makeRegel({ _uid: `r${i}`, aantal: '7', prijsPerStuk: '1.42', btwPercentage: 21 })
    )
    const result = berekenTotalen(regels, reistijdLeeg, zeroBedragen)
    expect(result.totaalExclCents).toBe(99_400)
    expect(result.totaalBtwCents).toBe(20_900)
    expect(result.totaalInclCents).toBe(120_300)
  })

  it('lege regel-array geeft 0 totaal', () => {
    const result = berekenTotalen([], reistijdLeeg, zeroBedragen)
    expect(result.totaalExclCents).toBe(0)
    expect(result.totaalBtwCents).toBe(0)
    expect(result.totaalInclCents).toBe(0)
    expect(result.perTarief).toHaveLength(0)
  })
  it('werkt met decimale aantallen (uren)', () => {
    const r = berekenRegel(makeRegel({ aantal: '1.5', prijsPerStuk: '80', btwPercentage: 21 }))
    expect(r.bedragExclCents).toBe(12_000) // 1.5 × €80 = €120
    expect(r.btwBedragCents).toBe(2_520) // 21% van €120
    expect(r.bedragInclCents).toBe(14_520)
  })

  it('accepteert komma als decimaal', () => {
    const r = berekenRegel(makeRegel({ aantal: '0,5', prijsPerStuk: '100', btwPercentage: 21 }))
    expect(r.bedragExclCents).toBe(5_000) // 0.5 × €100
  })
})
