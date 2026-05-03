// src/main/services/factuur-template.ts

import { readFileSync, existsSync } from 'node:fs'
import { extname } from 'node:path'
import { getLogoPath } from '../paths'
import type { Factuur } from '../../shared/types'

type Instellingen = Record<string, string>

// ============================================================
// Helpers
// ============================================================

function formatBedrag(bedrag: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(bedrag)
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function escape(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function nl2br(s: string | null | undefined): string {
  return escape(s).replace(/\n/g, '<br>')
}

function logoAsDataUrl(logoFilename: string | undefined): string | null {
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

function klantAdresBlock(f: Factuur): string {
  const k = f.klant
  const lines: string[] = []
  if (k.type === 'zakelijk' && k.bedrijfsnaam) {
    lines.push(`<strong>${escape(k.bedrijfsnaam)}</strong>`)
  }
  const naamLine = [k.aanhef, k.voornaam, k.achternaam].filter(Boolean).join(' ')
  if (naamLine) lines.push(escape(naamLine))
  if (k.adres) lines.push(escape(k.adres))
  if (k.postcode || k.plaats) {
    lines.push(`${escape(k.postcode || '')} ${escape(k.plaats || '')}`.trim())
  }
  if (k.type === 'zakelijk' && k.btwNummer) {
    lines.push(`<span class="muted">BTW: ${escape(k.btwNummer)}</span>`)
  }
  return lines.join('<br>')
}

function bedrijfAdresBlock(i: Instellingen): string {
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

function bedrijfFinancieelBlock(i: Instellingen): string {
  const items: string[] = []
  if (i.kvk_nummer) items.push(`KvK: ${escape(i.kvk_nummer)}`)
  if (i.btw_nummer) items.push(`BTW: ${escape(i.btw_nummer)}`)
  if (i.iban) items.push(`IBAN: ${escape(i.iban)}`)
  if (i.bic) items.push(`BIC: ${escape(i.bic)}`)
  if (i.banknaam) items.push(escape(i.banknaam))
  return items.join(' · ')
}

// ============================================================
// Totalen (splitsing per BTW-tarief)
// ============================================================

function berekenBtwSplitsing(f: Factuur): Array<{
  percentage: number
  over: number
  btw: number
}> {
  const map = new Map<number, { over: number; btw: number }>()
  for (const regel of f.regels) {
    const huidig = map.get(regel.btwPercentage) || { over: 0, btw: 0 }
    map.set(regel.btwPercentage, {
      over: huidig.over + regel.bedragExcl,
      btw: huidig.btw + regel.btwBedrag
    })
  }
  return Array.from(map.entries())
    .map(([pct, b]) => ({
      percentage: pct,
      over: Math.round(b.over * 100) / 100,
      btw: Math.round(b.btw * 100) / 100
    }))
    .sort((a, b) => a.percentage - b.percentage)
}

// ============================================================
// Main template
// ============================================================

export function renderFactuurHtml(factuur: Factuur, instellingen: Instellingen): string {
  const logoData = logoAsDataUrl(instellingen.logo_filename)
  const splitsing = berekenBtwSplitsing(factuur)
  const betaaltermijn = instellingen.betaaltermijn_dagen || '14'
  const voorwaarden = (
    instellingen.factuur_voorwaarden ||
    'Wij verzoeken u het bedrag binnen {betaaltermijn} dagen over te maken.'
  ).replace('{betaaltermijn}', betaaltermijn)

  const bedrijfsnaam = escape(instellingen.bedrijfsnaam || 'Mijn Bedrijf')

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Factuur ${escape(factuur.factuurNummer)}</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    color: #111;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .muted { color: #666; }
  .small { font-size: 8.5pt; }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    border-bottom: 2px solid #111;
    padding-bottom: 15px;
  }
  .header-left { max-width: 55%; }
  .header-left h1 {
    margin: 0 0 4px 0;
    font-size: 16pt;
    font-weight: 700;
  }
  .header-right { text-align: right; max-width: 45%; }
  .header-right img {
    max-height: 70px;
    max-width: 200px;
    object-fit: contain;
  }

  /* Adresblokken */
  .addresses {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
  }
  .address-block {
    width: 48%;
  }
  .address-block h3 {
    margin: 0 0 6px 0;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    font-weight: 600;
  }

  /* Factuur meta */
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }
  .meta-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
  }
  .meta-table tr:last-child td { border-bottom: none; }
  .meta-table .label {
    color: #666;
    width: 30%;
    font-size: 9pt;
  }
  .meta-table .value {
    font-weight: 500;
  }

  /* Regels */
  .regels {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .regels thead th {
    text-align: left;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    padding: 8px 6px;
    border-bottom: 2px solid #111;
  }
  .regels thead th.num { text-align: right; }
  .regels tbody td {
    padding: 8px 6px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .regels tbody td.num { text-align: right; white-space: nowrap; }
  .regels .datum { width: 70px; color: #666; font-size: 9pt; }
  .regels .omschrijving { width: auto; }
  .regels .aantal { width: 40px; }
  .regels .prijs { width: 80px; }
  .regels .btw { width: 40px; color: #666; }
  .regels .totaal { width: 90px; font-weight: 500; }

  /* Totalen */
  .totalen-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 30px;
  }
  .totalen {
    min-width: 280px;
  }
  .totalen .row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }
  .totalen .row.subtotaal {
    border-top: 1px solid #ccc;
    padding-top: 8px;
    margin-top: 4px;
  }
  .totalen .row.btw-regel {
    font-size: 9pt;
    color: #666;
  }
  .totalen .row.totaal {
    border-top: 2px solid #111;
    padding-top: 8px;
    margin-top: 6px;
    font-size: 12pt;
    font-weight: 700;
  }

  /* Opmerkingen */
  .opmerkingen {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 4px;
    padding: 10px 12px;
    margin-bottom: 20px;
    font-size: 9pt;
  }
  .opmerkingen-title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  /* Voorwaarden */
  .voorwaarden {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid #e5e7eb;
    font-size: 9pt;
    color: #333;
  }

  /* Footer */
  .footer {
    margin-top: 40px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    font-size: 8pt;
    color: #666;
    text-align: center;
  }

  /* Page break avoidance */
  .regels tr, .totalen, .opmerkingen {
    page-break-inside: avoid;
  }

  /* Status-watermark voor concept/geannuleerd */
  .watermark {
    position: fixed;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80pt;
    font-weight: 900;
    color: rgba(200, 0, 0, 0.08);
    z-index: 0;
    pointer-events: none;
    letter-spacing: 10px;
  }
</style>
</head>
<body>

${
  factuur.status === 'concept'
    ? '<div class="watermark">CONCEPT</div>'
    : factuur.status === 'geannuleerd'
      ? '<div class="watermark">GEANNULEERD</div>'
      : ''
}

<div class="header">
  <div class="header-left">
    <h1>${bedrijfsnaam}</h1>
    <div class="muted small">${bedrijfAdresBlock(instellingen)}</div>
  </div>
  <div class="header-right">
    ${logoData ? `<img src="${logoData}" alt="Logo">` : ''}
  </div>
</div>

<div class="addresses">
  <div class="address-block">
    <h3>Factuur voor</h3>
    <div>${klantAdresBlock(factuur)}</div>
  </div>
  <div class="address-block" style="text-align: right;">
    <h3>Factuur</h3>
    <div style="font-size: 14pt; font-weight: 700;">${escape(factuur.factuurNummer)}</div>
  </div>
</div>

<table class="meta-table">
  <tr>
    <td class="label">Factuurdatum</td>
    <td class="value">${formatDatum(factuur.datum)}</td>
  </tr>
  <tr>
    <td class="label">Vervaldatum</td>
    <td class="value">${formatDatum(factuur.vervalDatum)}</td>
  </tr>
  ${
    factuur.referentie
      ? `<tr><td class="label">Referentie</td><td class="value">${escape(factuur.referentie)}</td></tr>`
      : ''
  }
</table>

<table class="regels">
  <thead>
    <tr>
      <th class="datum">Datum</th>
      <th class="omschrijving">Omschrijving</th>
      <th class="num aantal">Aantal</th>
      <th class="num prijs">Prijs</th>
      <th class="num btw">BTW</th>
      <th class="num totaal">Totaal</th>
    </tr>
  </thead>
  <tbody>
    ${factuur.regels
      .map(
        (r) => `
      <tr>
        <td class="datum">${formatDatum(r.datum)}</td>
        <td class="omschrijving">${escape(r.omschrijving)}</td>
        <td class="num aantal">${r.aantal}</td>
        <td class="num prijs">${formatBedrag(r.prijsPerStuk)}</td>
        <td class="num btw">${r.btwPercentage}%</td>
        <td class="num totaal">${formatBedrag(r.bedragIncl)}</td>
      </tr>
    `
      )
      .join('')}
  </tbody>
</table>

<div class="totalen-wrap">
  <div class="totalen">
    <div class="row subtotaal">
      <span>Subtotaal excl. BTW</span>
      <span>${formatBedrag(factuur.totaalExcl)}</span>
    </div>
    ${splitsing
      .map(
        (s) => `
      <div class="row btw-regel">
        <span>BTW ${s.percentage}% over ${formatBedrag(s.over)}</span>
        <span>${formatBedrag(s.btw)}</span>
      </div>
    `
      )
      .join('')}
    <div class="row totaal">
      <span>Te betalen</span>
      <span>${formatBedrag(factuur.totaalIncl)}</span>
    </div>
  </div>
</div>

${
  factuur.opmerkingen
    ? `<div class="opmerkingen">
        <div class="opmerkingen-title">Opmerkingen</div>
        <div>${nl2br(factuur.opmerkingen)}</div>
      </div>`
    : ''
}

<div class="voorwaarden">
  ${nl2br(voorwaarden)}
</div>

<div class="footer">
  ${bedrijfFinancieelBlock(instellingen)}
</div>

</body>
</html>`
}
