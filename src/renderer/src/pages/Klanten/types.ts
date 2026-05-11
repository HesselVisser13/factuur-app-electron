//src/renderer/src/pages/Klanten/types.ts

import type { Klant } from '@shared/types'
import type { KlantFormValues } from './klantFormSchema'

export const emptyKlantForm: KlantFormValues = {
  type: 'particulier',
  bedrijfsnaam: '',
  aanhef: '',
  voornaam: '',
  achternaam: '',
  adres: '',
  postcode: '',
  plaats: '',
  email: '',
  telefoon: '',
  kvkNummer: '',
  btwNummer: ''
}

/** Klant uit DB → form-state */
export function klantToFormValues(k: Klant): KlantFormValues {
  return {
    type: k.type,
    bedrijfsnaam: k.bedrijfsnaam || '',
    aanhef: k.aanhef || '',
    voornaam: k.voornaam || '',
    achternaam: k.achternaam || '',
    adres: k.adres || '',
    postcode: k.postcode || '',
    plaats: k.plaats || '',
    email: k.email || '',
    telefoon: k.telefoon || '',
    kvkNummer: k.kvkNummer || '',
    btwNummer: k.btwNummer || ''
  }
}
