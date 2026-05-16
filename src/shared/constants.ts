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
