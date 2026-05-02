// src/main/services/berekening.service.ts

export function round(n: number): number {
  return Math.round(n * 100) / 100
}

export interface BerekendesBedragen {
  bedragExcl: number
  btwBedrag: number
  bedragIncl: number
}

export function berekenBedragen(
  bedrag: number,
  invoerwijze: 'exclusief' | 'inclusief',
  btwPercentage: number
): BerekendesBedragen {
  const factor = btwPercentage / 100

  if (invoerwijze === 'exclusief') {
    const bedragExcl = bedrag
    const btwBedrag = round(bedragExcl * factor)
    const bedragIncl = round(bedragExcl + btwBedrag)
    return { bedragExcl, btwBedrag, bedragIncl }
  } else {
    const bedragIncl = bedrag
    const bedragExcl = round(bedragIncl / (1 + factor))
    const btwBedrag = round(bedragIncl - bedragExcl)
    return { bedragExcl, btwBedrag, bedragIncl }
  }
}
