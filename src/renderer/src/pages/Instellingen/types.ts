// src/renderer/src/pages/Instellingen/types.ts

import type { InstellingenFormValues } from './instellingenFormSchema'

export const DEFAULT_VOORWAARDEN =
  'Wij verzoeken u vriendelijk het verschuldigde bedrag binnen {betaaltermijn} dagen over te maken onder vermelding van het factuurnummer.'

export const defaultInstellingen: InstellingenFormValues = {
  bedrijfsnaam: '',
  eigenaar_naam: '',
  kvk_nummer: '',
  btw_nummer: '',
  iban: '',
  bic: '',
  banknaam: '',
  adres: '',
  postcode: '',
  plaats: '',
  telefoon: '',
  email: '',
  website: '',
  betaaltermijn_dagen: '14',
  is_starter: 'false',
  logo_filename: '',
  factuur_voorwaarden: DEFAULT_VOORWAARDEN,
  reiskosten_uurtarief: '55',
  reiskosten_kmtarief: '',
  reiskosten_btw_tarief_id: '',
  reiskosten_omschrijving: 'Reistijd'
}

/** Map server-data naar form-values, met fallbacks. */
export function mapToForm(data: Record<string, string>): InstellingenFormValues {
  return {
    bedrijfsnaam: data.bedrijfsnaam || '',
    eigenaar_naam: data.eigenaar_naam || '',
    kvk_nummer: data.kvk_nummer || '',
    btw_nummer: data.btw_nummer || '',
    iban: data.iban || '',
    bic: data.bic || '',
    banknaam: data.banknaam || '',
    adres: data.adres || '',
    postcode: data.postcode || '',
    plaats: data.plaats || '',
    telefoon: data.telefoon || '',
    email: data.email || '',
    website: data.website || '',
    betaaltermijn_dagen: data.betaaltermijn_dagen || '14',
    is_starter: data.is_starter === 'true' ? 'true' : 'false',
    logo_filename: data.logo_filename || '',
    factuur_voorwaarden: data.factuur_voorwaarden || DEFAULT_VOORWAARDEN,
    reiskosten_uurtarief: data.reiskosten_uurtarief || '55',
    reiskosten_kmtarief: data.reiskosten_kmtarief || '',
    reiskosten_btw_tarief_id: data.reiskosten_btw_tarief_id || '',
    reiskosten_omschrijving: data.reiskosten_omschrijving || 'Reistijd'
  }
}
