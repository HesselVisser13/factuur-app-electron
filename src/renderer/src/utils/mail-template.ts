// src/renderer/src/utils/mail-template.ts

import { klantDisplayNaam } from '@shared/klant-utils'
import type { Factuur } from '@shared/types'

import { formatCurrency, formatDate } from './formatters'

interface TemplateContext {
  factuur: Factuur
  instellingen: Record<string, string>
}

/**
 * Vervang placeholders in een template met factuur + instellingen data.
 * Onbekende placeholders blijven onvervangen (zichtbaar als {key}).
 */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  const { factuur, instellingen } = ctx

  const replacements: Record<string, string> = {
    factuurNummer: factuur.factuurNummer,
    klantNaam: klantDisplayNaam(factuur.klant),
    totaalIncl: formatCurrency(factuur.totaalIncl),
    totaalExcl: formatCurrency(factuur.totaalExcl),
    vervalDatum: formatDate(factuur.vervalDatum),
    betaaltermijn: instellingen.betaaltermijn_dagen ?? '14',
    bedrijfsnaam: instellingen.bedrijfsnaam ?? '',
    eigenaarNaam: instellingen.eigenaar_naam ?? '',
    iban: instellingen.iban ?? ''
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return replacements[key] ?? match
  })
}
