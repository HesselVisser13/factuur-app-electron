// src/main/services/offerte-template.ts

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
import type { Offerte } from '../../shared/types'

type Instellingen = Record<string, string>

// ============================================================
// Offerte-specifieke helper
// ============================================================

function berekenBtwSplitsing(o: Offerte): Array<{
  percentage: number
  over: number
  btw: number
}> {
  const map = new Map<number, { over: number; btw: number }>()

  for (const regel of o.regels) {
    const huidig = map.get(regel.btwPercentage) || { over: 0, btw: 0 }
    map.set(regel.btwPercentage, {
      over: huidig.over + regel.bedragExcl,
      btw: huidig.btw + regel.btwBedrag
    })
  }

  if (
    o.reistijdBedragExcl &&
    o.reistijdBtwPercentage !== null &&
    o.reistijdBtwPercentage !== undefined
  ) {
    const huidig = map.get(o.reistijdBtwPercentage) || { over: 0, btw: 0 }
    map.set(o.reistijdBtwPercentage, {
      over: huidig.over + o.reistijdBedragExcl,
      btw: huidig.btw + (o.reistijdBtwBedrag || 0)
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
// Offerte-specifieke styles
// ============================================================

const OFFERTE_SPECIFIC_STYLES = `
/* Akkoord-blok */
.akkoord-block {
  margin-top: 30px;
  padding: 20px;
  border: 1px dashed #999;
  border-radius: 4px;
  page-break-inside: avoid;
}
.akkoord-block .akkoord-title {
  font-weight: 600;
  font-size: 11pt;
  margin-bottom: 12px;
}
.akkoord-block .akkoord-fields {
  display: flex;
  gap: 20px;
  margin-top: 16px;
}
.akkoord-block .akkoord-field {
  flex: 1;
}
.akkoord-block .akkoord-label {
  font-size: 9pt;
  color: #666;
  margin-bottom: 4px;
}
.akkoord-block .akkoord-line {
  border-bottom: 1px solid #333;
  height: 32px;
}
`

// ============================================================
// Main template
// ============================================================

export function renderOfferteHtml(offerte: Offerte, instellingen: Instellingen): string {
  const logoData = logoAsDataUrl(instellingen.logo_filename)
  const splitsing = berekenBtwSplitsing(offerte)
  const voorwaarden = (
    instellingen.offerte_voorwaarden ||
    'Deze offerte is geldig tot {geldigTot}. Bij akkoord vragen wij u dit document ondertekend te retourneren.'
  ).replace('{geldigTot}', formatDatum(offerte.geldigTot))

  const bedrijfsnaam = escape(instellingen.bedrijfsnaam || 'Mijn Bedrijf')

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Offerte ${escape(offerte.offerteNummer)}</title>
<style>
${SHARED_TEMPLATE_STYLES}
${OFFERTE_SPECIFIC_STYLES}
</style>
</head>
<body>

${
  logoData ? `<div class="page-watermark" style="background-image: url('${logoData}');"></div>` : ''
}

${
  offerte.status === 'concept'
    ? '<div class="watermark">CONCEPT</div>'
    : offerte.status === 'afgewezen'
      ? '<div class="watermark">AFGEWEZEN</div>'
      : offerte.status === 'verlopen'
        ? '<div class="watermark">VERLOPEN</div>'
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
    <h3>Offerte voor</h3>
    <div>${klantAdresBlock(offerte.klant)}</div>
  </div>
  <div class="address-block" style="text-align: right;">
    <h3>Offerte</h3>
    <div style="font-size: 14pt; font-weight: 700;">${escape(offerte.offerteNummer)}</div>
  </div>
</div>

<table class="meta-table">
  <tr>
    <td class="label">Offertedatum</td>
    <td class="value">${formatDatum(offerte.datum)}</td>
  </tr>
  <tr>
    <td class="label">Geldig tot</td>
    <td class="value">${formatDatum(offerte.geldigTot)}</td>
  </tr>
  ${
    offerte.referentie
      ? `<tr><td class="label">Referentie</td><td class="value">${escape(offerte.referentie)}</td></tr>`
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
    ${offerte.regels
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
  offerte.reistijdBedragExcl
    ? `<div class="reistijd-block">
        <div>
          <div class="label">${escape(offerte.reistijdOmschrijving || 'Reistijd')}</div>
          <div class="details">${formatReistijdDetails(offerte)}</div>
        </div>
        <div class="bedrag">${formatBedrag(offerte.reistijdBedragExcl)}</div>
      </div>`
    : ''
}

<div class="totalen-wrap">
  <div class="totalen">
    <div class="row subtotaal">
      <span>Subtotaal excl. BTW</span>
      <span>${formatBedrag(offerte.totaalExcl)}</span>
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
      <span>Totaal</span>
      <span>${formatBedrag(offerte.totaalIncl)}</span>
    </div>
  </div>
</div>

${
  offerte.opmerkingen
    ? `<div class="opmerkingen">
        <div class="opmerkingen-title">Opmerkingen</div>
        <div>${nl2br(offerte.opmerkingen)}</div>
      </div>`
    : ''
}

<div class="voorwaarden">
  ${nl2br(voorwaarden)}
</div>

${
  offerte.toonAkkoordBlok
    ? `<div class="akkoord-block">
        <div class="akkoord-title">Voor akkoord</div>
        <div class="muted small">
          Door ondertekening gaat u akkoord met de hierboven beschreven werkzaamheden tegen
          de getoonde prijs.
        </div>
        <div class="akkoord-fields">
          <div class="akkoord-field">
            <div class="akkoord-label">Datum</div>
            <div class="akkoord-line"></div>
          </div>
          <div class="akkoord-field">
            <div class="akkoord-label">Naam</div>
            <div class="akkoord-line"></div>
          </div>
          <div class="akkoord-field">
            <div class="akkoord-label">Handtekening</div>
            <div class="akkoord-line"></div>
          </div>
        </div>
      </div>`
    : ''
}

<div class="footer">
  ${bedrijfFinancieelBlock(instellingen)}
</div>

</body>
</html>`
}
