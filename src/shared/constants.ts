// src/shared/constants.ts

export const TRANSACTIE_TYPES = [
  { value: 'inkomst', label: 'Inkomst', color: 'green' },
  { value: 'uitgave', label: 'Uitgave', color: 'red' }
] as const

export const CATEGORIEEN = [
  { value: 'arbeid', label: 'Arbeid' },
  { value: 'materiaal', label: 'Materiaal' },
  { value: 'transport', label: 'Transport' },
  { value: 'gereedschap', label: 'Gereedschap' },
  { value: 'overig', label: 'Overig' }
] as const

export const INVOERWIJZEN = [
  { value: 'exclusief', label: 'Exclusief BTW (ik reken door)' },
  { value: 'inclusief', label: 'Inclusief BTW (bonnetje/kassabon)' }
] as const

export const KWARTALEN = [
  { value: 1, label: 'Q1 (jan-mrt)' },
  { value: 2, label: 'Q2 (apr-jun)' },
  { value: 3, label: 'Q3 (jul-sep)' },
  { value: 4, label: 'Q4 (okt-dec)' }
] as const

// ============================================================
// Mail-templates
// ============================================================

export const DEFAULT_MAIL_ONDERWERP = 'Factuur {factuurNummer} van {bedrijfsnaam}'

export const DEFAULT_MAIL_BODY = `Beste {klantNaam},

Bijgaand de factuur {factuurNummer} voor de geleverde diensten.

Het totaalbedrag van {totaalIncl} kan binnen {betaaltermijn} dagen worden overgemaakt op rekeningnummer {iban} onder vermelding van het factuurnummer.

Met vriendelijke groet,
{eigenaarNaam}
{bedrijfsnaam}`

export const MAIL_TEMPLATE_PLACEHOLDERS = [
  { key: 'factuurNummer', label: 'Factuurnummer', voorbeeld: '2025-001' },
  { key: 'klantNaam', label: 'Naam klant', voorbeeld: 'Jan Jansen' },
  { key: 'totaalIncl', label: 'Totaalbedrag (incl. BTW)', voorbeeld: '€ 1.210,00' },
  { key: 'totaalExcl', label: 'Totaalbedrag (excl. BTW)', voorbeeld: '€ 1.000,00' },
  { key: 'vervalDatum', label: 'Vervaldatum', voorbeeld: '15-02-2025' },
  { key: 'betaaltermijn', label: 'Betaaltermijn (dagen)', voorbeeld: '14' },
  { key: 'bedrijfsnaam', label: 'Eigen bedrijfsnaam', voorbeeld: 'Mijn Bedrijf' },
  { key: 'eigenaarNaam', label: 'Eigen naam', voorbeeld: 'Jouw Naam' },
  { key: 'iban', label: 'IBAN', voorbeeld: 'NL00 BANK 0000 0000 00' }
] as const

// ============================================================
// Foto-limieten
// ============================================================

export const FOTO_LIMITS = {
  MAX_FILE_SIZE_MB: 20,
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,
  MAX_PHOTOS_PER_KLANT: 100,
  THUMB_SIZE_PX: 300,
  JPEG_QUALITY: 92,
  THUMB_QUALITY: 80
} as const

export const SUPPORTED_FOTO_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'] as const

// ============================================================
// Backup
// ============================================================

/**
 * Backup-format versie. Bij breaking changes in de backup-structuur
 * (bv. nieuwe folders, andere database-schema) verhogen we dit.
 *
 * Restore weigert backups van een hoger format-versie.
 */
export const BACKUP_FORMAT_VERSION = 1

/** Bestandsnaam-pattern voor backups. */
export const BACKUP_FILENAME_PREFIX = 'BTW-App-Backup'

/** Naam van het manifest-bestand binnen elke backup-ZIP. */
export const BACKUP_MANIFEST_FILENAME = 'backup-manifest.json'

// ============================================================
// BTW-tarieven (Nederlandse belastingdienst)
// ============================================================

/**
 * Standaard NL BTW-tarieven die bij installatie in de database worden gezet.
 *
 * SINGLE SOURCE OF TRUTH: alle code in de app refereert naar deze constants.
 * Bij wetswijziging: pas hier aan, schrijf migratie indien nodig, release.
 */
export const BTW_TARIEVEN_DEFAULTS = [
  {
    naam: 'Hoog tarief',
    percentage: 21,
    geldigVanaf: '2012-10-01'
  },
  {
    naam: 'Laag tarief',
    percentage: 9,
    geldigVanaf: '2019-01-01'
  },
  {
    naam: 'Vrijgesteld',
    percentage: 0,
    geldigVanaf: '2001-01-01'
  }
] as const

export type BtwTariefDefault = (typeof BTW_TARIEVEN_DEFAULTS)[number]

/**
 * Helper om een specifiek tarief op te halen uit een lijst van DB-tarieven.
 * Gebruikt de naam (stable) i.p.v. percentage (kan wijzigen).
 *
 * Returnt het matched tarief, of `null` als niet gevonden.
 */
export function vindTariefOpNaam<T extends { naam: string }>(
  tarieven: readonly T[],
  naam: BtwTariefDefault['naam']
): T | null {
  return tarieven.find((t) => t.naam === naam) ?? null
}

/** Het hoofdtarief voor nieuwe regels (default selectie). */
export const STANDAARD_TARIEF_NAAM: BtwTariefDefault['naam'] = 'Hoog tarief'

// ============================================================
// Cashflow / Status filtering
// ============================================================

/**
 * Factuur-statussen die meetellen als "omzet" voor cashflow/dashboard.
 * Concepten en geannuleerde facturen tellen niet mee.
 */
export const OMZET_STATUSSEN = ['verstuurd', 'betaald'] as const

/**
 * Factuur-statussen die meetellen als "ontvangen" (echt geld binnen).
 */
export const ONTVANGEN_STATUSSEN = ['betaald'] as const

/**
 * Factuur-statussen die "openstaand" betekenen (verzonden, nog niet betaald).
 */
export const OPENSTAAND_STATUSSEN = ['verstuurd'] as const
