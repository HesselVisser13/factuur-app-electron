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

// IPC response wrapper
export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}
