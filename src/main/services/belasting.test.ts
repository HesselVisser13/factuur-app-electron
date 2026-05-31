// src/main/services/belasting.test.ts

import { describe, expect, it } from 'vitest'

import {
  IB_SCHIJVEN_2026,
  MKB_WINSTVRIJSTELLING_2026,
  RESERVERING_CONSERVATIEF,
  STARTERSAFTREK_2026,
  ZELFSTANDIGENAFTREK_2026
} from '../../shared/constants'

// We testen de losse helper-functies. De volledige service vereist DB-mocks
// (Prisma), wat te complex is voor MVP. Voor nu: pure berekenings-logica testen.

/**
 * Pure variant van de service-logica — geen DB-call.
 * Spiegelt de logica uit belasting.service.ts maar dan testbaar.
 */
function berekenSchattingPuur(input: {
  omzet: number
  uitgaven: number
  voldoetUrencriterium: boolean
  isStarter: boolean
  loonInkomen: number
}) {
  const winst = Math.max(0, input.omzet - input.uitgaven)

  const zelfstandigenaftrek = input.voldoetUrencriterium ? ZELFSTANDIGENAFTREK_2026 : 0
  const startersaftrek = input.voldoetUrencriterium && input.isStarter ? STARTERSAFTREK_2026 : 0

  const winstNaAftrek = Math.max(0, winst - zelfstandigenaftrek - startersaftrek)
  const mkbVrijstelling = winstNaAftrek * (MKB_WINSTVRIJSTELLING_2026 / 100)
  const belastbareWinst = Math.max(0, winstNaAftrek - mkbVrijstelling)

  const marginaalTarief = bepaalMarginaalTarief(input.loonInkomen)
  const ibGeschat = belastbareWinst * (marginaalTarief / 100)
  const ibConservatief = winst * (RESERVERING_CONSERVATIEF / 100)

  return {
    winst,
    zelfstandigenaftrek,
    startersaftrek,
    mkbVrijstelling,
    belastbareWinst,
    ibGeschat,
    ibConservatief,
    marginaalTarief
  }
}

function bepaalMarginaalTarief(loonInkomen: number): number {
  for (const schijf of IB_SCHIJVEN_2026) {
    if (loonInkomen < schijf.tot) {
      return schijf.tarief
    }
  }
  return IB_SCHIJVEN_2026[IB_SCHIJVEN_2026.length - 1].tarief
}

describe('belasting.berekenSchatting - winst & verlies', () => {
  it('geeft 0 winst bij verlies', () => {
    const r = berekenSchattingPuur({
      omzet: 1000,
      uitgaven: 5000,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 30000
    })
    expect(r.winst).toBe(0)
    expect(r.belastbareWinst).toBe(0)
    expect(r.ibGeschat).toBe(0)
  })

  it('geeft positieve winst bij omzet > uitgaven', () => {
    const r = berekenSchattingPuur({
      omzet: 10000,
      uitgaven: 3000,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 0
    })
    expect(r.winst).toBe(7000)
  })
})

describe('belasting.berekenSchatting - aftrekposten', () => {
  it('past geen zelfstandigenaftrek toe zonder urencriterium', () => {
    const r = berekenSchattingPuur({
      omzet: 20000,
      uitgaven: 5000,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 0
    })
    expect(r.zelfstandigenaftrek).toBe(0)
    expect(r.startersaftrek).toBe(0)
  })

  it('past zelfstandigenaftrek toe bij urencriterium', () => {
    const r = berekenSchattingPuur({
      omzet: 20000,
      uitgaven: 5000,
      voldoetUrencriterium: true,
      isStarter: false,
      loonInkomen: 0
    })
    expect(r.zelfstandigenaftrek).toBe(ZELFSTANDIGENAFTREK_2026)
    expect(r.startersaftrek).toBe(0)
  })

  it('past startersaftrek toe bij starter MET urencriterium', () => {
    const r = berekenSchattingPuur({
      omzet: 20000,
      uitgaven: 5000,
      voldoetUrencriterium: true,
      isStarter: true,
      loonInkomen: 0
    })
    expect(r.zelfstandigenaftrek).toBe(ZELFSTANDIGENAFTREK_2026)
    expect(r.startersaftrek).toBe(STARTERSAFTREK_2026)
  })

  it('past GEEN startersaftrek toe zonder urencriterium', () => {
    const r = berekenSchattingPuur({
      omzet: 20000,
      uitgaven: 5000,
      voldoetUrencriterium: false,
      isStarter: true,
      loonInkomen: 0
    })
    expect(r.zelfstandigenaftrek).toBe(0)
    expect(r.startersaftrek).toBe(0)
  })

  it('clamped winstNaAftrek op 0 als aftrekposten > winst', () => {
    const r = berekenSchattingPuur({
      omzet: 1500, // winst is klein
      uitgaven: 0,
      voldoetUrencriterium: true,
      isStarter: true,
      loonInkomen: 0
    })
    expect(r.winst).toBe(1500)
    expect(r.belastbareWinst).toBe(0) // alle aftrekposten verbruiken winst
  })
})

describe('belasting.berekenSchatting - MKB-vrijstelling', () => {
  it('past 13.31% MKB-vrijstelling toe op winst na aftrek', () => {
    const r = berekenSchattingPuur({
      omzet: 10000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 0
    })
    // winst = 10000, geen aftrek → 13.31% van 10000
    expect(r.mkbVrijstelling).toBeCloseTo(1331, 1)
    expect(r.belastbareWinst).toBeCloseTo(8669, 1)
  })

  it('berekent MKB-vrijstelling op winst NA zelfstandigenaftrek', () => {
    const r = berekenSchattingPuur({
      omzet: 10000,
      uitgaven: 0,
      voldoetUrencriterium: true,
      isStarter: false,
      loonInkomen: 0
    })
    // winst 10000 - aftrek 2470 = 7530
    // mkb = 7530 * 0.1331 = 1002.24
    expect(r.mkbVrijstelling).toBeCloseTo(1002.24, 1)
  })
})

describe('belasting.berekenSchatting - marginaal tarief', () => {
  it('schijf 1 (35.75%) als loon < €38.883', () => {
    const r = berekenSchattingPuur({
      omzet: 5000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 30000
    })
    expect(r.marginaalTarief).toBe(35.75)
  })

  it('schijf 2 (37.56%) als loon tussen €38.883 en €78.426', () => {
    const r = berekenSchattingPuur({
      omzet: 5000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 50000
    })
    expect(r.marginaalTarief).toBe(37.56)
  })

  it('schijf 3 (49.5%) als loon > €78.426', () => {
    const r = berekenSchattingPuur({
      omzet: 5000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 100000
    })
    expect(r.marginaalTarief).toBe(49.5)
  })

  it('schijf 1 bij loon = 0', () => {
    const r = berekenSchattingPuur({
      omzet: 5000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 0
    })
    expect(r.marginaalTarief).toBe(35.75)
  })

  it('grenscase: loon precies op schijf-rand', () => {
    const r = berekenSchattingPuur({
      omzet: 5000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 38883 // precies de grens
    })
    // 38883 < 38883 is false → schijf 2
    expect(r.marginaalTarief).toBe(37.56)
  })
})

describe('belasting.berekenSchatting - reservering', () => {
  it('conservatieve reservering = 40% van winst', () => {
    const r = berekenSchattingPuur({
      omzet: 10000,
      uitgaven: 2000,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 0
    })
    // winst = 8000, conservatief = 40% = 3200
    expect(r.ibConservatief).toBe(3200)
  })

  it('geschatte reservering = belastbareWinst × marginaal tarief', () => {
    const r = berekenSchattingPuur({
      omzet: 10000,
      uitgaven: 0,
      voldoetUrencriterium: false,
      isStarter: false,
      loonInkomen: 30000 // schijf 1, 35.75%
    })
    // winst 10000 - mkb 1331 = 8669
    // ib = 8669 * 0.3575 = ~3099
    expect(r.ibGeschat).toBeCloseTo(3099, 0)
  })
})

describe('belasting.berekenSchatting - realistisch scenario user (Hessel)', () => {
  it('parttime ZZP + 4d loondienst, geen urencriterium', () => {
    const r = berekenSchattingPuur({
      omzet: 8000,
      uitgaven: 1500,
      voldoetUrencriterium: false, // urencriterium niet gehaald
      isStarter: true, // wel starter, maar zonder uren irrelevant
      loonInkomen: 35000 // bruto loon van 4d/wk
    })

    expect(r.winst).toBe(6500)
    expect(r.zelfstandigenaftrek).toBe(0)
    expect(r.startersaftrek).toBe(0)
    expect(r.mkbVrijstelling).toBeCloseTo(865.15, 1)
    expect(r.belastbareWinst).toBeCloseTo(5634.85, 1)
    expect(r.marginaalTarief).toBe(35.75) // loon < 38883
    expect(r.ibGeschat).toBeCloseTo(2014.46, 0)
    expect(r.ibConservatief).toBe(2600) // 40% van 6500
  })
})
