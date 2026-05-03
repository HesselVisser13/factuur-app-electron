// src/shared/types.ts
export type FactuurStatus = 'concept' | 'verstuurd' | 'betaald' | 'geannuleerd'

// PDF
export type PdfResult = { filePath: string; factuurNummer: string }
export type PdfSaveAsResult = { saved: boolean; filePath: string | null }
export type PdfOpenResult = { filePath: string }
export type PdfOpenFolderResult = { folder: string }

export interface BtwTarief {
  id: number
  naam: string
  percentage: number
  geldigVanaf: string
  geldigTot: string | null
  bron: string
}

export interface Transactie {
  id: number
  type: 'inkomst' | 'uitgave'
  omschrijving: string
  bedrag: number
  invoerwijze: 'exclusief' | 'inclusief'
  btwTariefId: number
  btwPercentage: number
  bedragExcl: number
  btwBedrag: number
  bedragIncl: number
  datum: string
  categorie: string | null
  notitie: string | null
}

export interface BtwAangifteRegel {
  tariefNaam: string
  percentage: number
  omzet: number
  verschuldigdeBtw: number
  inkoop: number
  voorbelasting: number
}

export interface BtwAangifte {
  van: string
  tot: string
  regels: BtwAangifteRegel[]
  totaalVerschuldigd: number
  totaalVoorbelasting: number
  afTeDragen: number
}

export interface Klant {
  id: number
  type: 'particulier' | 'zakelijk'
  bedrijfsnaam: string | null
  aanhef: string | null
  voornaam: string | null
  achternaam: string | null
  adres: string | null
  postcode: string | null
  plaats: string | null
  email: string | null
  telefoon: string | null
  kvkNummer: string | null
  btwNummer: string | null
  createdAt: string
  updatedAt: string
}

export interface FactuurRegel {
  id: number
  factuurId: number
  datum: string
  omschrijving: string
  aantal: number
  prijsPerStuk: number
  btwTariefId: number
  btwPercentage: number
  bedragExcl: number
  btwBedrag: number
  bedragIncl: number
  volgorde: number
}

export interface Factuur {
  id: number
  factuurNummer: string
  klantId: number
  klant: Klant
  datum: string
  vervalDatum: string
  referentie: string | null
  status: FactuurStatus
  opmerkingen: string | null
  totaalExcl: number
  totaalBtw: number
  totaalIncl: number
  regels: FactuurRegel[]
  createdAt: string
  updatedAt: string
}

// IPC response wrapper
export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}

export type DashboardStats = {
  openstaand: {
    aantal: number
    bedrag: number
  }
  vervallen: {
    aantal: number
    bedrag: number
  }
  ditKwartaal: {
    aantal: number
    bedrag: number
  }
  laatsteFacturen: Factuur[]
}
