// src/main/services/pdf.service.ts

import { BrowserWindow } from 'electron'
import { writeFileSync } from 'node:fs'
import { getDatabase } from '../db/client'
import { getFactuurPdfPath } from '../paths'
import { renderFactuurHtml } from './factuur-template'
import { log } from '../logger'
import type { Factuur, PdfResult } from '../../shared/types'

// ============================================================
// Helpers
// ============================================================

async function loadInstellingen(): Promise<Record<string, string>> {
  const prisma = getDatabase()
  const rows = await prisma.instelling.findMany()
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

async function loadFactuur(id: number): Promise<Factuur> {
  const prisma = getDatabase()
  const factuur = await prisma.factuur.findUniqueOrThrow({
    where: { id },
    include: { klant: true, regels: true }
  })
  // Serialize dates to ISO (same vorm als service)
  return {
    ...factuur,
    status: factuur.status as Factuur['status'],
    datum: factuur.datum.toISOString(),
    vervalDatum: factuur.vervalDatum.toISOString(),
    createdAt: factuur.createdAt.toISOString(),
    updatedAt: factuur.updatedAt.toISOString(),
    klant: {
      ...factuur.klant,
      type: factuur.klant.type as 'particulier' | 'zakelijk',
      createdAt: factuur.klant.createdAt.toISOString(),
      updatedAt: factuur.klant.updatedAt.toISOString()
    },
    regels: factuur.regels
      .sort((a, b) => a.volgorde - b.volgorde)
      .map((r) => ({ ...r, datum: r.datum.toISOString() }))
  }
}

// ============================================================
// Core PDF generator
// ============================================================

async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  try {
    // Load HTML via data URL (geen tijdelijk bestand nodig)
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    await win.loadURL(dataUrl)

    // Korte delay zodat fonts/images zeker zijn gerenderd
    await new Promise((resolve) => setTimeout(resolve, 200))

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'default'
      }
    })

    return pdfBuffer
  } finally {
    win.destroy()
  }
}

// ============================================================
// Service
// ============================================================

export class PdfService {
  /**
   * Genereert PDF voor factuur en slaat op in userData/facturen/.
   * Geeft het pad terug.
   */
  async genereerFactuurPdf(factuurId: number): Promise<PdfResult> {
    const [factuur, instellingen] = await Promise.all([loadFactuur(factuurId), loadInstellingen()])

    const html = renderFactuurHtml(factuur, instellingen)
    const pdfBuffer = await htmlToPdfBuffer(html)

    const filePath = getFactuurPdfPath(factuur.factuurNummer)
    writeFileSync(filePath, pdfBuffer)
    log.info(`[PDF] Factuur PDF opgeslagen: ${filePath}`)

    return { filePath, factuurNummer: factuur.factuurNummer }
  }

  /**
   * Geeft de PDF terug als Buffer (zonder opslaan).
   * Handig voor preview of 'Save as...'.
   */
  async genereerFactuurPdfBuffer(factuurId: number): Promise<Buffer> {
    const [factuur, instellingen] = await Promise.all([loadFactuur(factuurId), loadInstellingen()])
    const html = renderFactuurHtml(factuur, instellingen)
    return htmlToPdfBuffer(html)
  }

  /**
   * Geeft alleen de HTML terug (voor in-app preview in iframe).
   */
  async genereerFactuurHtml(factuurId: number): Promise<string> {
    const [factuur, instellingen] = await Promise.all([loadFactuur(factuurId), loadInstellingen()])
    return renderFactuurHtml(factuur, instellingen)
  }
}

export const pdfService = new PdfService()
