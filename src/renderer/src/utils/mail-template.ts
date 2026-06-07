// src/renderer/src/utils/mail-template.ts

import { klantDisplayNaam } from '@shared/klant-utils'
import type { Factuur, Offerte } from '@shared/types'

import { formatCurrency, formatDate } from './formatters'

type FactuurContext = {
  type: 'factuur'
  factuur: Factuur
  instellingen: Record<string, string>
}

type OfferteContext = {
  type: 'offerte'
  offerte: Offerte
  instellingen: Record<string, string>
}

export type TemplateContext = FactuurContext | OfferteContext

/**
 * Vervang placeholders in een template.
 * Onbekende placeholders blijven onvervangen (zichtbaar als {key}).
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  const replacements = buildReplacements(ctx)
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return replacements[key] ?? match
  })
}

function buildReplacements(ctx: TemplateContext): Record<string, string> {
  const { instellingen } = ctx

  const base: Record<string, string> = {
    bedrijfsnaam: instellingen.bedrijfsnaam ?? '',
    eigenaarNaam: instellingen.eigenaar_naam ?? '',
    iban: instellingen.iban ?? '',
    betaaltermijn: instellingen.betaaltermijn_dagen ?? '14'
  }

  if (ctx.type === 'factuur') {
    const f = ctx.factuur
    return {
      ...base,
      factuurNummer: f.factuurNummer,
      klantNaam: klantDisplayNaam(f.klant),
      totaalIncl: formatCurrency(f.totaalIncl),
      totaalExcl: formatCurrency(f.totaalExcl),
      vervalDatum: formatDate(f.vervalDatum)
    }
  }

  // offerte
  const o = ctx.offerte
  return {
    ...base,
    offerteNummer: o.offerteNummer,
    klantNaam: klantDisplayNaam(o.klant),
    totaalIncl: formatCurrency(o.totaalIncl),
    totaalExcl: formatCurrency(o.totaalExcl),
    geldigTot: formatDate(o.geldigTot)
  }
}
