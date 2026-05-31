// src/main/services/belasting.service.ts

import {
  IB_SCHIJVEN_2026,
  MKB_WINSTVRIJSTELLING_2026,
  RESERVERING_CONSERVATIEF,
  STARTERSAFTREK_2026,
  ZELFSTANDIGENAFTREK_2026,
  OMZET_STATUSSEN
} from '../../shared/constants'
import type { BelastingInput, InvesteringInput } from '../../shared/schemas'
import type { BelastingSchatting, InvesteringResultaat } from '../../shared/types'
import { getDatabase } from '../db/client'
import { log } from '../logger'

/** Convert euro (DB) naar cents (transport). Round-safe. */
function toCents(euro: number): number {
  return Math.round(euro * 100 + Number.EPSILON * Math.abs(euro * 100))
}

export class BelastingService {
  /**
   * Berekent IB-schatting voor een jaar op basis van:
   * - ZZP-omzet (verstuurd + betaalde facturen)
   * - ZZP-uitgaven (alle uitgave-transacties)
   * - Loon-inkomen (handmatig opgegeven)
   * - Aftrekposten (urencriterium, starter)
   *
   * Geeft output in cents.
   */
  async berekenSchatting(input: BelastingInput): Promise<BelastingSchatting> {
    log.info(`[belasting] Schatting voor jaar ${input.jaar}`)

    const prisma = getDatabase()

    const van = new Date(input.jaar, 0, 1)
    const tot = new Date(input.jaar, 11, 31, 23, 59, 59)

    const [facturen, transacties] = await Promise.all([
      prisma.factuur.findMany({
        where: {
          datum: { gte: van, lte: tot },
          status: { in: [...OMZET_STATUSSEN] }
        },
        select: { totaalExcl: true }
      }),
      prisma.transactie.findMany({
        where: {
          datum: { gte: van, lte: tot },
          type: 'uitgave'
        },
        select: { bedragExcl: true }
      })
    ])

    // Omzet en uitgaven (excl. BTW = belastbaar)
    const omzetEuro = facturen.reduce((sum, f) => sum + f.totaalExcl, 0)
    const uitgavenEuro = transacties.reduce((sum, t) => sum + t.bedragExcl, 0)
    const winstEuro = Math.max(0, omzetEuro - uitgavenEuro)

    // Aftrekposten
    const zelfstandigenaftrekEuro = input.voldoetUrencriterium ? ZELFSTANDIGENAFTREK_2026 : 0
    const startersaftrekEuro =
      input.voldoetUrencriterium && input.isStarter ? STARTERSAFTREK_2026 : 0

    const winstNaAftrek = Math.max(0, winstEuro - zelfstandigenaftrekEuro - startersaftrekEuro)

    // MKB-winstvrijstelling
    const mkbVrijstellingEuro = winstNaAftrek * (MKB_WINSTVRIJSTELLING_2026 / 100)
    const belastbareWinstEuro = Math.max(0, winstNaAftrek - mkbVrijstellingEuro)

    // Marginaal IB-tarief o.b.v. loon-inkomen
    const marginaalTarief = bepaalMarginaalTarief(input.loonInkomen)

    // Geschatte IB
    const ibGeschatEuro = belastbareWinstEuro * (marginaalTarief / 100)
    const ibConservatiefEuro = winstEuro * (RESERVERING_CONSERVATIEF / 100)

    // Reservering per maand
    const reserveringPerMaandConservatief = ibConservatiefEuro / 12
    const reserveringPerMaandGeschat = ibGeschatEuro / 12

    return {
      jaar: input.jaar,
      zzpOmzet: toCents(omzetEuro),
      zzpUitgaven: toCents(uitgavenEuro),
      zzpWinst: toCents(winstEuro),
      zelfstandigenaftrek: toCents(zelfstandigenaftrekEuro),
      startersaftrek: toCents(startersaftrekEuro),
      mkbVrijstelling: toCents(mkbVrijstellingEuro),
      belastbareWinst: toCents(belastbareWinstEuro),
      ibConservatief: toCents(ibConservatiefEuro),
      ibGeschat: toCents(ibGeschatEuro),
      marginaalTarief,
      reserveringPerMaandConservatief: toCents(reserveringPerMaandConservatief),
      reserveringPerMaandGeschat: toCents(reserveringPerMaandGeschat)
    }
  }

  /**
   * Pure BTW-rekenmachine voor investeringen.
   *
   * Geen fiscaal advies — alleen rekensom: hoeveel BTW vorder je terug,
   * en wat zijn de effectieve kosten?
   *
   * Werkt in cents intern voor precisie.
   */
  berekenInvestering(input: InvesteringInput): InvesteringResultaat {
    const bedragCents = toCents(input.bedrag)
    const factor = input.btwPercentage / 100

    let bedragExclCents: number
    let bedragInclCents: number

    if (input.invoerwijze === 'inclusief') {
      // bedrag is incl BTW → reken excl uit
      bedragInclCents = bedragCents
      bedragExclCents = Math.round(bedragInclCents / (1 + factor))
    } else {
      // bedrag is excl BTW → reken incl uit
      bedragExclCents = bedragCents
      bedragInclCents = Math.round(bedragExclCents * (1 + factor))
    }

    const btwTerugCents = bedragInclCents - bedragExclCents

    return {
      bedragExcl: bedragExclCents,
      bedragIncl: bedragInclCents,
      btwTerug: btwTerugCents,
      btwPercentage: input.btwPercentage
    }
  }
}

/**
 * Bepaalt het marginale IB-tarief o.b.v. loon-inkomen.
 *
 * "Marginaal" = het tarief dat geldt voor elke extra euro inkomen.
 * Dus als loon al boven schijf 1 zit, valt elke ZZP-euro
 * automatisch in schijf 2 of 3.
 */
function bepaalMarginaalTarief(loonInkomen: number): number {
  for (const schijf of IB_SCHIJVEN_2026) {
    if (loonInkomen < schijf.tot) {
      return schijf.tarief
    }
  }
  return IB_SCHIJVEN_2026[IB_SCHIJVEN_2026.length - 1].tarief
}

export const belastingService = new BelastingService()
