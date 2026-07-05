// src/main/services/factuur-template.ts

import {
  bedrijfAdresBlock,
  bedrijfFinancieelBlock,
  escape,
  formatBedrag,
  formatDatum,
  formatReistijdDetails,
  klantAdresBlock,
  logoAsDataUrl,
  nl2br,
  SHARED_TEMPLATE_STYLES
} from './document-template'
import type { Factuur } from '../../shared/types'
import { generateEpcQrDataUrl } from './epc-qr'

type Instellingen = Record<string, string>

// ============================================================
// Factuur-specifieke helpers
// ============================================================

async function genereerBetaalQrDataUrl(factuur: Factuur, i: Instellingen): Promise<string | null> {
  if (factuur.status === 'concept' || factuur.status === 'geannuleerd') {
    return null
  }
  if (!i.iban || !i.bedrijfsnaam) {
    return null
  }

  return generateEpcQrDataUrl({
    iban: i.iban,
    naamOntvanger: i.bedrijfsnaam,
    bedrag: factuur.totaalIncl,
    mededeling: factuur.factuurNummer,
    bic: i.bic || undefined
  })
}

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

  if (
    f.reistijdBedragExcl &&
    f.reistijdBtwPercentage !== null &&
    f.reistijdBtwPercentage !== undefined
  ) {
    const huidig = map.get(f.reistijdBtwPercentage) || { over: 0, btw: 0 }
    map.set(f.reistijdBtwPercentage, {
      over: huidig.over + f.reistijdBedragExcl,
      btw: huidig.btw + (f.reistijdBtwBedrag || 0)
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
// Factuur-specifieke styles
// ============================================================

const FACTUUR_SPECIFIC_STYLES = `
/* Betaal-blok met QR */
.betaal-block {
  margin: 20px 0;
  padding: 14px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  page-break-inside: avoid;
}

.betaal-block .info { flex: 1; }
.betaal-block .info-title {
  font-weight: 600;
  font-size: 10pt;
  margin-bottom: 6px;
  color: #075985;
}
.betaal-block .info-line { font-size: 9pt; margin: 2px 0; }
.betaal-block .info-label {
  color: #666;
  display: inline-block;
  width: 80px;
}
.betaal-block .qr-wrap {
  flex-shrink: 0;
  text-align: center;
}
.betaal-block .qr-wrap img {
  width: 110px;
  height: 110px;
  display: block;
}
.betaal-block .qr-caption {
  font-size: 8pt;
  color: #666;
  margin-top: 4px;
}
`

// ============================================================
// Main template
// ============================================================

export async function renderFactuurHtml(
  factuur: Factuur,
  instellingen: Instellingen
): Promise<string> {
  const logoData = logoAsDataUrl(instellingen.logo_filename)
  const qrData = await genereerBetaalQrDataUrl(factuur, instellingen)
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
${SHARED_TEMPLATE_STYLES}
${FACTUUR_SPECIFIC_STYLES}
</style>
</head>
<body>

${
  logoData ? `<div class="page-watermark" style="background-image: url('${logoData}');"></div>` : ''
}

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
    <div>${klantAdresBlock(factuur.klant)}</div>
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

${
  factuur.reistijdBedragExcl
    ? `<div class="reistijd-block">
        <div>
          <div class="label">${escape(factuur.reistijdOmschrijving || 'Reistijd')}</div>
          <div class="details">${formatReistijdDetails(factuur)}</div>
        </div>
        <div class="bedrag">${formatBedrag(factuur.reistijdBedragExcl)}</div>
      </div>`
    : ''
}

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
  qrData
    ? `<div class="betaal-block">
        <div class="info">
          <div class="info-title">Betaalgegevens</div>
          <div class="info-line"><span class="info-label">IBAN:</span> ${escape(instellingen.iban || '')}</div>
          <div class="info-line"><span class="info-label">T.n.v.:</span> ${escape(instellingen.bedrijfsnaam || '')}</div>
          <div class="info-line"><span class="info-label">Bedrag:</span> ${formatBedrag(factuur.totaalIncl)}</div>
          <div class="info-line"><span class="info-label">Vermelding:</span> ${escape(factuur.factuurNummer)}</div>
        </div>
        <div class="qr-wrap">
          <img src="${qrData}" alt="QR-code voor betaling">
          <div class="qr-caption">
            Scan met je bank-app<br>
            <span style="font-size:7pt; color:#777;">
              iDEAL niet ondersteund
            </span>
          </div>
        </div>
      </div>`
    : ''
}

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
