// src/main/services/epc-qr.ts

import QRCode from 'qrcode'

import { log } from '../logger'

/**
 * EPC QR Code (SEPA Credit Transfer) genereert een QR-code volgens de
 * European Payments Council standaard. Alle grote NL bank-apps (ING, ABN,
 * Rabo, KNAB, Bunq, etc.) ondersteunen het scannen hiervan.
 *
 * Specificatie: https://www.europeanpaymentscouncil.eu/document-library/...
 *
 * Format:
 *   BCD                   ← Service tag
 *   002                   ← Version
 *   1                     ← Character set (1 = UTF-8)
 *   SCT                   ← Identification (SEPA Credit Transfer)
 *   {BIC}                 ← Optioneel (sinds 2016 niet meer verplicht voor SEPA)
 *   {Naam ontvanger}      ← Max 70 tekens
 *   {IBAN}                ← Geen spaties
 *   EUR{bedrag}           ← Bv. EUR1234.56
 *   {Doel}                ← Optioneel (bv. invoice purpose code)
 *   {Referentie}          ← Optioneel
 *   {Mededeling}          ← Vrije tekst, max 140 tekens
 */
export interface EpcQrInput {
  iban: string
  naamOntvanger: string
  bedrag: number // in euro's
  mededeling: string
  bic?: string
}

/**
 * Genereert EPC QR-payload + render als data URL (PNG).
 *
 * Returnt `null` als input ongeldig is — dan tonen we geen QR
 * i.p.v. een corrupte.
 */
export async function generateEpcQrDataUrl(input: EpcQrInput): Promise<string | null> {
  const validation = validateInput(input)
  if (!validation.valid) {
    log.warn(`[epc-qr] Ongeldige input: ${validation.reason}`)
    return null
  }

  const payload = buildPayload(input)

  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      scale: 6,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (err) {
    log.error('[epc-qr] QR-generatie mislukt', err)
    return null
  }
}

// ============================================================
// Internals
// ============================================================

function validateInput(input: EpcQrInput): { valid: boolean; reason?: string } {
  if (!input.iban || !input.iban.trim()) {
    return { valid: false, reason: 'IBAN ontbreekt' }
  }

  const ibanClean = normalizeIban(input.iban)
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(ibanClean)) {
    return { valid: false, reason: 'IBAN ongeldig formaat' }
  }

  if (!input.naamOntvanger || !input.naamOntvanger.trim()) {
    return { valid: false, reason: 'Naam ontbreekt' }
  }
  if (input.naamOntvanger.length > 70) {
    return { valid: false, reason: 'Naam te lang (max 70 tekens)' }
  }

  if (input.bedrag <= 0 || !isFinite(input.bedrag)) {
    return { valid: false, reason: 'Bedrag ongeldig' }
  }
  if (input.bedrag > 999999999.99) {
    return { valid: false, reason: 'Bedrag te hoog' }
  }

  if (input.mededeling && input.mededeling.length > 140) {
    return { valid: false, reason: 'Mededeling te lang (max 140 tekens)' }
  }

  return { valid: true }
}

function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}

function buildPayload(input: EpcQrInput): string {
  const lines = [
    'BCD', // Service tag
    '002', // Version (002 supports IBAN without BIC)
    '1', // UTF-8
    'SCT', // SEPA Credit Transfer
    input.bic?.trim().toUpperCase() ?? '', // BIC (optioneel)
    input.naamOntvanger.trim().slice(0, 70),
    normalizeIban(input.iban),
    `EUR${input.bedrag.toFixed(2)}`,
    '', // Purpose (leeg = generic)
    '', // Structured reference (leeg, we gebruiken vrije tekst hieronder)
    input.mededeling.trim().slice(0, 140)
  ]

  return lines.join('\n')
}
