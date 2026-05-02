// tests/berekening.test.ts

import { describe, it, expect } from 'vitest'
import { berekenBedragen, round } from '../src/main/services/berekening.service'

describe('round', () => {
  it('rondt af op 2 decimalen', () => {
    expect(round(10.005)).toBe(10.01)
    expect(round(10.004)).toBe(10)
    expect(round(99.999)).toBe(100)
  })
})

describe('berekenBedragen', () => {
  describe('exclusief BTW', () => {
    it('berekent 21% BTW correct', () => {
      const result = berekenBedragen(100, 'exclusief', 21)
      expect(result.bedragExcl).toBe(100)
      expect(result.btwBedrag).toBe(21)
      expect(result.bedragIncl).toBe(121)
    })

    it('berekent 9% BTW correct', () => {
      const result = berekenBedragen(5500, 'exclusief', 9)
      expect(result.bedragExcl).toBe(5500)
      expect(result.btwBedrag).toBe(495)
      expect(result.bedragIncl).toBe(5995)
    })

    it('berekent 0% BTW correct', () => {
      const result = berekenBedragen(1000, 'exclusief', 0)
      expect(result.bedragExcl).toBe(1000)
      expect(result.btwBedrag).toBe(0)
      expect(result.bedragIncl).toBe(1000)
    })
  })

  describe('inclusief BTW', () => {
    it('berekent 21% BTW terug correct', () => {
      const result = berekenBedragen(121, 'inclusief', 21)
      expect(result.bedragExcl).toBe(100)
      expect(result.btwBedrag).toBe(21)
      expect(result.bedragIncl).toBe(121)
    })

    it('berekent 9% BTW terug correct', () => {
      const result = berekenBedragen(109, 'inclusief', 9)
      expect(result.bedragExcl).toBe(100)
      expect(result.btwBedrag).toBe(9)
      expect(result.bedragIncl).toBe(109)
    })

    it('berekent bonnetje diesel correct', () => {
      const result = berekenBedragen(96.8, 'inclusief', 21)
      expect(result.bedragExcl).toBe(80)
      expect(result.btwBedrag).toBe(16.8)
      expect(result.bedragIncl).toBe(96.8)
    })
  })
})
