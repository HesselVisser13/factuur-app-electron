import type { Klant } from './types'

/** Hoofdnaam voor lijsten, dropdowns en factuur-header */
export function klantDisplayNaam(k: Klant): string {
  if (k.type === 'zakelijk') {
    return k.bedrijfsnaam || '(naamloos)'
  }
  const parts = [k.aanhef, k.voornaam, k.achternaam].filter(Boolean)
  return parts.join(' ') || '(naamloos)'
}

/** Volledige adresregels voor op de factuur */
export function klantAdresRegels(k: Klant): string[] {
  const regels: string[] = []

  if (k.type === 'zakelijk') {
    if (k.bedrijfsnaam) regels.push(k.bedrijfsnaam)
    const contact = [k.aanhef, k.voornaam, k.achternaam].filter(Boolean).join(' ')
    if (contact) regels.push(contact)
  } else {
    const naam = [k.aanhef, k.voornaam, k.achternaam].filter(Boolean).join(' ')
    if (naam) regels.push(naam)
  }

  if (k.adres) regels.push(k.adres)
  const postcodePlaats = [k.postcode, k.plaats].filter(Boolean).join(' ')
  if (postcodePlaats) regels.push(postcodePlaats)

  return regels
}
