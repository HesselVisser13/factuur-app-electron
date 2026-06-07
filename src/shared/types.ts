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
  reistijdUren: number | null
  reistijdKm: number | null
  reistijdBedragExcl: number | null
  reistijdBtwBedrag: number | null
  reistijdBtwPercentage: number | null
  reistijdBtwTariefId: number | null
  reistijdOmschrijving: string | null
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

export type DashboardBedrag = {
  incl: number
  excl: number
}

export type DashboardStats = {
  openstaand: {
    aantal: number
    bedrag: DashboardBedrag
  }
  vervallen: {
    aantal: number
    bedrag: DashboardBedrag
  }
  ditKwartaal: {
    aantal: number
    bedrag: DashboardBedrag
  }
  laatsteFacturen: Factuur[]
}

export interface FotoRecord {
  id: number
  klantId: number
  filename: string
  originalName: string
  bytes: number
  takenAt: string | null
  notitie: string | null
  createdAt: string
}

export interface AddFotoInput {
  klantId: number
  sourcePath: string
  originalName: string
}

export interface BackupManifest {
  formatVersion: number
  appVersion: string
  createdAt: string
  contents: {
    klanten: number
    facturen: number
    transacties: number
    fotos: number
    factuurPdfs: number
    hasLogo: boolean
  }
}

export interface BackupResult {
  filePath: string
  bytes: number
  manifest: BackupManifest
}

export interface RestoreResult {
  manifest: BackupManifest
  rolledBack: boolean
}

export interface AutoBackupStatus {
  enabled: boolean
  folder: string
  isCustomFolder: boolean
  consecutiveFailures: number
  lastAutoBackupAt: string | null
  lastBackupAt: string | null
}

export interface AutoBackupRunResult {
  ran: boolean
  success?: boolean
  filePath?: string
  bytes?: number
  reason?: string
  errorMsg?: string
}

// ============================================================
// Cashflow types
// ============================================================

export interface CashflowKpis {
  /** In cents */
  gefactureerd: number
  /** In cents */
  ontvangen: number
  /** In cents */
  openstaand: number
  /** In cents */
  uitgaven: number
  /** In cents */
  resultaat: number

  aantalFacturen: number
  aantalTransacties: number
}

export interface MaandData {
  maand: string
  label: string
  /** In cents */
  inkomsten: number
  /** In cents */
  uitgaven: number
  /** In cents */
  saldo: number
}

export interface CategorieData {
  categorie: string
  label: string
  /** In cents */
  bedrag: number
  /** Percentage met 1 decimaal */
  percentage: number
}

export interface KlantOmzetData {
  klantId: number
  klantNaam: string
  /** In cents */
  bedrag: number
  /** Percentage met 1 decimaal */
  percentage: number
}

export interface CashflowOverview {
  kpis: CashflowKpis
  perMaand: MaandData[]
  uitgavenPerCategorie: CategorieData[]
  topKlanten: KlantOmzetData[]
}

export interface CashflowPeriod {
  van: string // YYYY-MM-DD
  tot: string // YYYY-MM-DD
}

// ============================================================
// Belasting / IB-schatting
// ============================================================

export interface BelastingSchatting {
  /** Inkomen voor de periode */
  jaar: number

  /** Cijfers vanuit transacties/facturen */
  zzpOmzet: number // cents
  zzpUitgaven: number // cents
  zzpWinst: number // cents

  /** Aftrekposten (per jaar geldig) */
  zelfstandigenaftrek: number // cents (0 als geen urencriterium)
  startersaftrek: number // cents (0 als geen starter of geen urencriterium)
  mkbVrijstelling: number // cents

  belastbareWinst: number // cents (na alle aftrekposten)

  /** Berekende IB-bedragen */
  ibConservatief: number // cents (40% van winst, voor veiligheid)
  ibGeschat: number // cents (marginaal tarief o.b.v. loon)
  marginaalTarief: number // percentage (35.75 / 37.56 / 49.5)

  /** Reservering per maand (op basis van geschat / 12) */
  reserveringPerMaandConservatief: number // cents
  reserveringPerMaandGeschat: number // cents
}

// ============================================================
// Investering calculator
// ============================================================

export interface InvesteringResultaat {
  /** Alle bedragen in cents */
  bedragExcl: number
  bedragIncl: number
  btwTerug: number
  btwPercentage: number
}

// ============================================================
// Offerte
// ============================================================

import type { OfferteStatus } from './schemas'

export interface OfferteRegel {
  id: number
  offerteId: number
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

export interface Offerte {
  id: number
  offerteNummer: string
  klantId: number
  klant: Klant
  datum: string
  geldigTot: string
  referentie: string | null
  status: OfferteStatus
  opmerkingen: string | null
  toonAkkoordBlok: boolean

  totaalExcl: number
  totaalBtw: number
  totaalIncl: number

  reistijdUren: number | null
  reistijdKm: number | null
  reistijdBedragExcl: number | null
  reistijdBtwBedrag: number | null
  reistijdBtwPercentage: number | null
  reistijdBtwTariefId: number | null
  reistijdOmschrijving: string | null

  regels: OfferteRegel[]

  factuurId: number | null

  createdAt: string
  updatedAt: string
}
