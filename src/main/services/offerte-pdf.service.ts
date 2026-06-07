// src/main/services/offerte-pdf.service.ts

import { writeFileSync } from 'node:fs'

import { BrowserWindow } from 'electron'

import type { Offerte } from '../../shared/types'
import { getDatabase } from '../db/client'
import { log } from '../logger'
import { getOffertePdfPath } from '../paths'

import { renderOfferteHtml } from './offerte-template'

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

async function loadOfferte(id: number): Promise<Offerte> {
  const prisma = getDatabase()
  const offerte = await prisma.offerte.findUniqueOrThrow({
    where: { id },
    include: { klant: true, regels: true }
  })

  return {
    ...offerte,
    status: offerte.status as Offerte['status'],
    datum: offerte.datum.toISOString(),
    geldigTot: offerte.geldigTot.toISOString(),
    createdAt: offerte.createdAt.toISOString(),
    updatedAt: offerte.updatedAt.toISOString(),
    klant: {
      ...offerte.klant,
      type: offerte.klant.type as 'particulier' | 'zakelijk',
      createdAt: offerte.klant.createdAt.toISOString(),
      updatedAt: offerte.klant.updatedAt.toISOString()
    },
    regels: offerte.regels
      .sort((a, b) => a.volgorde - b.volgorde)
      .map((r) => ({ ...r, datum: r.datum.toISOString() }))
  }
}

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
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    await win.loadURL(dataUrl)

    await new Promise((resolve) => setTimeout(resolve, 200))

    return await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'default' }
    })
  } finally {
    win.destroy()
  }
}

// ============================================================
// Service
// ============================================================

export interface OffertePdfResult {
  filePath: string
  offerteNummer: string
}

export class OffertePdfService {
  /**
   * Genereert PDF voor offerte en slaat op in userData/offertes/.
   * Geeft het pad terug.
   */
  async genereerOffertePdf(offerteId: number): Promise<OffertePdfResult> {
    const [offerte, instellingen] = await Promise.all([loadOfferte(offerteId), loadInstellingen()])

    const html = renderOfferteHtml(offerte, instellingen)
    const pdfBuffer = await htmlToPdfBuffer(html)

    const filePath = getOffertePdfPath(offerte.offerteNummer)
    writeFileSync(filePath, pdfBuffer)
    log.info(`[PDF] Offerte PDF opgeslagen: ${filePath}`)

    return { filePath, offerteNummer: offerte.offerteNummer }
  }

  /**
   * Geeft de PDF terug als Buffer (zonder opslaan).
   * Voor preview of 'Save as...'.
   */
  async genereerOffertePdfBuffer(offerteId: number): Promise<Buffer> {
    const [offerte, instellingen] = await Promise.all([loadOfferte(offerteId), loadInstellingen()])

    const html = renderOfferteHtml(offerte, instellingen)
    return htmlToPdfBuffer(html)
  }

  /**
   * Geeft alleen de HTML terug (voor in-app preview in iframe).
   */
  async genereerOfferteHtml(offerteId: number): Promise<string> {
    const [offerte, instellingen] = await Promise.all([loadOfferte(offerteId), loadInstellingen()])
    return renderOfferteHtml(offerte, instellingen)
  }
}

export const offertePdfService = new OffertePdfService()
