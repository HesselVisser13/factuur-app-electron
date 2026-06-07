// src/main/services/document-template/styles.ts

/**
 * Gedeelde CSS voor factuur en offerte PDF-templates.
 *
 * Wordt geïncludeerd in beide templates via een template-string.
 * Document-specifieke CSS (zoals .betaal-block voor factuur of
 * .akkoord-block voor offerte) staat in de individuele templates.
 */
export const SHARED_TEMPLATE_STYLES = `
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

  /* Body achtergrond met groot logo (watermark-style) */
  .page-watermark {
    position: fixed;
    top: 44%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60vmin;
    height: 60vmin;
    opacity: 0.05;
    z-index: 0;
    pointer-events: none;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
  }

  /* Zorg dat content boven watermark staat */
  .header,
  .addresses,
  .meta-table,
  .regels,
  .totalen-wrap,
  .betaal-block,
  .akkoord-block,
  .opmerkingen,
  .voorwaarden,
  .footer,
  .reistijd-block {
    position: relative;
    z-index: 1;
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

  /* Meta-table */
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
  .regels tr, .totalen, .opmerkingen, .akkoord-block {
    page-break-inside: avoid;
  }

  /* Status-watermark voor concept/geannuleerd/etc */
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

  /* Reistijd blok */
  .reistijd-block {
    margin: 0 0 20px 0;
    padding: 10px 12px;
    background: #f8f9fa;
    border-left: 3px solid #111;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .reistijd-block .label {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .reistijd-block .details {
    color: #666;
    font-size: 9pt;
  }

  .reistijd-block .bedrag {
    text-align: right;
    font-weight: 500;
    white-space: nowrap;
  }
`
