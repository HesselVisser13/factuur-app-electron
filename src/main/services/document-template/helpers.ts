// src/main/services/document-template/helpers.ts

import { existsSync, readFileSync } from 'node:fs'
import { extname } from 'node:path'

import { getLogoPath } from '../../paths'

// ============================================================
// Formatters
// ============================================================

export function formatBedrag(bedrag: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(bedrag)
}

export function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// ============================================================
// HTML escaping
// ============================================================

export function escape(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function nl2br(s: string | null | undefined): string {
  return escape(s).replace(/\n/g, '<br>')
}

// ============================================================
// Logo
// ============================================================

export function logoAsDataUrl(logoFilename: string | undefined): string | null {
  if (!logoFilename) return null
  const path = getLogoPath(logoFilename)
  if (!existsSync(path)) return null
  const ext = extname(logoFilename).toLowerCase().replace('.', '')
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'png'
        ? 'image/png'
        : ext === 'svg'
          ? 'image/svg+xml'
          : 'image/png'
  const data = readFileSync(path).toString('base64')
  return `data:${mime};base64,${data}`
}

// ============================================================
// Klant-blok
// ============================================================

interface KlantLike {
  type: string
  bedrijfsnaam: string | null
  aanhef: string | null
  voornaam: string | null
  achternaam: string | null
  adres: string | null
  postcode: string | null
  plaats: string | null
  btwNummer: string | null
}

export function klantAdresBlock(klant: KlantLike): string {
  const lines: string[] = []
  if (klant.type === 'zakelijk' && klant.bedrijfsnaam) {
    lines.push(`<strong>${escape(klant.bedrijfsnaam)}</strong>`)
  }
  const naamLine = [klant.aanhef, klant.voornaam, klant.achternaam].filter(Boolean).join(' ')
  if (naamLine) lines.push(escape(naamLine))
  if (klant.adres) lines.push(escape(klant.adres))
  if (klant.postcode || klant.plaats) {
    lines.push(`${escape(klant.postcode || '')} ${escape(klant.plaats || '')}`.trim())
  }
  if (klant.type === 'zakelijk' && klant.btwNummer) {
    lines.push(`<span class="muted">BTW: ${escape(klant.btwNummer)}</span>`)
  }
  return lines.join('<br>')
}

// ============================================================
// Bedrijfsgegevens
// ============================================================

type Instellingen = Record<string, string>

export function bedrijfAdresBlock(i: Instellingen): string {
  const lines: string[] = []
  if (i.adres) lines.push(escape(i.adres))
  if (i.postcode || i.plaats) {
    lines.push(`${escape(i.postcode || '')} ${escape(i.plaats || '')}`.trim())
  }
  if (i.telefoon) lines.push(`Tel: ${escape(i.telefoon)}`)
  if (i.email) lines.push(escape(i.email))
  if (i.website) lines.push(escape(i.website))
  return lines.join('<br>')
}

export function bedrijfFinancieelBlock(i: Instellingen): string {
  const items: string[] = []
  if (i.kvk_nummer) items.push(`KvK: ${escape(i.kvk_nummer)}`)
  if (i.btw_nummer) items.push(`BTW: ${escape(i.btw_nummer)}`)
  if (i.iban) items.push(`IBAN: ${escape(i.iban)}`)
  if (i.bic) items.push(`BIC: ${escape(i.bic)}`)
  if (i.banknaam) items.push(escape(i.banknaam))
  return items.join(' · ')
}

// ============================================================
// Reistijd-detail formatter (gedeelde shape)
// ============================================================

interface ReistijdLike {
  reistijdUren: number | null
  reistijdKm: number | null
}

export function formatReistijdDetails(doc: ReistijdLike): string {
  if (!doc.reistijdUren) return ''
  const parts: string[] = [`${doc.reistijdUren} uur`]
  if (doc.reistijdKm && doc.reistijdKm > 0) {
    parts.push(`${doc.reistijdKm} km`)
  }
  return parts.join(' · ')
}
