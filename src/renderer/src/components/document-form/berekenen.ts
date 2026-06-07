// src/renderer/src/components/document-form/berekenen.ts

import {
  type Cents,
  btwInCents,
  euroToCents,
  multiplyCents,
  parseEuroString,
  sumCents
} from '@renderer/utils/money'

import type { RegelFormValues, ReistijdFormValues, ReistijdInstellingen } from './types'

export type RegelBedragen = {
  bedragExclCents: Cents
  btwBedragCents: Cents
  bedragInclCents: Cents
}

export function berekenRegel(regel: RegelFormValues): RegelBedragen {
  const aantal = parseInt(regel.aantal, 10) || 0
  const prijsCents = parseEuroString(regel.prijsPerStuk)
  const bedragExclCents = multiplyCents(prijsCents, aantal)
  const btwBedragCents = btwInCents(bedragExclCents, regel.btwPercentage)
  const bedragInclCents = sumCents([bedragExclCents, btwBedragCents])
  return { bedragExclCents, btwBedragCents, bedragInclCents }
}

export function berekenReistijd(
  reistijd: ReistijdFormValues,
  instellingen: ReistijdInstellingen
): RegelBedragen {
  if (!reistijd.enabled) {
    const zero = euroToCents(0)
    return { bedragExclCents: zero, btwBedragCents: zero, bedragInclCents: zero }
  }

  const uren = parseFloat(reistijd.uren) || 0
  const km = parseFloat(reistijd.km) || 0

  const uurtariefCents = euroToCents(instellingen.uurtarief)
  const kmtariefCents = euroToCents(instellingen.kmtarief)

  const urenBedrag = multiplyCents(uurtariefCents, uren)
  const kmBedrag = multiplyCents(kmtariefCents, km)

  const bedragExclCents = sumCents([urenBedrag, kmBedrag])
  const btwBedragCents = btwInCents(bedragExclCents, reistijd.btwPercentage)
  const bedragInclCents = sumCents([bedragExclCents, btwBedragCents])

  return { bedragExclCents, btwBedragCents, bedragInclCents }
}

export type TotalenPerTarief = {
  percentage: number
  overCents: Cents
  btwCents: Cents
}

export type Totalen = {
  totaalExclCents: Cents
  totaalBtwCents: Cents
  totaalInclCents: Cents
  perTarief: TotalenPerTarief[]
}

export function berekenTotalen(
  regels: RegelFormValues[],
  reistijd: ReistijdFormValues,
  reistijdBedrag: RegelBedragen
): Totalen {
  const regelBedragen = regels.map(berekenRegel)

  let totaalExclCents = sumCents(regelBedragen.map((b) => b.bedragExclCents))
  let totaalBtwCents = sumCents(regelBedragen.map((b) => b.btwBedragCents))
  let totaalInclCents = sumCents(regelBedragen.map((b) => b.bedragInclCents))

  const perTariefMap = new Map<number, { overCents: Cents; btwCents: Cents }>()

  regels.forEach((regel, i) => {
    const b = regelBedragen[i]
    const huidig = perTariefMap.get(regel.btwPercentage) ?? {
      overCents: euroToCents(0),
      btwCents: euroToCents(0)
    }
    perTariefMap.set(regel.btwPercentage, {
      overCents: sumCents([huidig.overCents, b.bedragExclCents]),
      btwCents: sumCents([huidig.btwCents, b.btwBedragCents])
    })
  })

  if (reistijd.enabled && reistijdBedrag.bedragExclCents > 0) {
    totaalExclCents = sumCents([totaalExclCents, reistijdBedrag.bedragExclCents])
    totaalBtwCents = sumCents([totaalBtwCents, reistijdBedrag.btwBedragCents])
    totaalInclCents = sumCents([totaalInclCents, reistijdBedrag.bedragInclCents])

    const huidig = perTariefMap.get(reistijd.btwPercentage) ?? {
      overCents: euroToCents(0),
      btwCents: euroToCents(0)
    }
    perTariefMap.set(reistijd.btwPercentage, {
      overCents: sumCents([huidig.overCents, reistijdBedrag.bedragExclCents]),
      btwCents: sumCents([huidig.btwCents, reistijdBedrag.btwBedragCents])
    })
  }

  return {
    totaalExclCents,
    totaalBtwCents,
    totaalInclCents,
    perTarief: Array.from(perTariefMap.entries())
      .map(([percentage, b]) => ({
        percentage,
        overCents: b.overCents,
        btwCents: b.btwCents
      }))
      .sort((a, b) => a.percentage - b.percentage)
  }
}
