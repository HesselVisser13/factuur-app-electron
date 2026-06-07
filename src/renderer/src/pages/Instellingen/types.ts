// src/renderer/src/pages/Instellingen/types.ts

import {
  DEFAULT_MAIL_BODY,
  DEFAULT_MAIL_ONDERWERP,
  DEFAULT_MAIL_OFFERTE_BODY,
  DEFAULT_MAIL_OFFERTE_ONDERWERP
} from '@shared/constants'

import type { InstellingenFormValues } from './instellingenFormSchema'

export const DEFAULT_VOORWAARDEN =
  'Wij verzoeken u vriendelijk het verschuldigde bedrag binnen {betaaltermijn} dagen over te maken onder vermelding van het factuurnummer.'

export const DEFAULT_OFFERTE_VOORWAARDEN =
  'Deze offerte is geldig tot {geldigTot}. Bij akkoord vragen wij u dit document ondertekend te retourneren of per mail akkoord te bevestigen.'

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
  offerte_voorwaarden: DEFAULT_OFFERTE_VOORWAARDEN, // ← NIEUW
  reiskosten_uurtarief: '55',
  reiskosten_kmtarief: '',
  reiskosten_btw_tarief_id: '',
  reiskosten_omschrijving: 'Reistijd',
  mail_onderwerp_template: DEFAULT_MAIL_ONDERWERP,
  mail_body_template: DEFAULT_MAIL_BODY,
  mail_offerte_onderwerp_template: DEFAULT_MAIL_OFFERTE_ONDERWERP,
  mail_offerte_body_template: DEFAULT_MAIL_OFFERTE_BODY,
  backup_auto_enabled: 'true',
  backup_auto_folder: '',
  voldoet_urencriterium: 'false',
  is_starter_ib: 'false',
  loon_inkomen: ''
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
    offerte_voorwaarden: data.offerte_voorwaarden || DEFAULT_OFFERTE_VOORWAARDEN, // ← AANGEPAST
    reiskosten_uurtarief: data.reiskosten_uurtarief || '55',
    reiskosten_kmtarief: data.reiskosten_kmtarief || '',
    reiskosten_btw_tarief_id: data.reiskosten_btw_tarief_id || '',
    reiskosten_omschrijving: data.reiskosten_omschrijving || 'Reistijd',
    mail_onderwerp_template: data.mail_onderwerp_template || DEFAULT_MAIL_ONDERWERP,
    mail_body_template: data.mail_body_template || DEFAULT_MAIL_BODY,
    mail_offerte_onderwerp_template:
      data.mail_offerte_onderwerp_template || DEFAULT_MAIL_OFFERTE_ONDERWERP,
    mail_offerte_body_template: data.mail_offerte_body_template || DEFAULT_MAIL_OFFERTE_BODY,
    backup_auto_enabled: data.backup_auto_enabled === 'false' ? 'false' : 'true',
    backup_auto_folder: data.backup_auto_folder || '',
    voldoet_urencriterium: data.voldoet_urencriterium === 'true' ? 'true' : 'false',
    is_starter_ib: data.is_starter_ib === 'true' ? 'true' : 'false',
    loon_inkomen: data.loon_inkomen || ''
  }
}
