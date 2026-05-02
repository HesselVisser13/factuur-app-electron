// src/shared/types.ts

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

// IPC response wrapper
export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}
