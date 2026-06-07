// src/renderer/src/api/offertes.ts

import type { OfferteInput, OfferteStatus, OfferteUpdate } from '@shared/schemas'
import type { Offerte } from '@shared/types'

export const offertesApi = {
  // CRUD
  getAll: (): Promise<Offerte[]> => window.api.getOffertes(),
  getById: (id: number): Promise<Offerte> => window.api.getOfferteById(id),
  getNextNummer: (datum?: string): Promise<string> => window.api.getNextOfferteNummer(datum),
  create: (input: OfferteInput): Promise<Offerte> => window.api.createOfferte(input),
  update: (input: OfferteUpdate): Promise<Offerte> => window.api.updateOfferte(input),
  updateStatus: (id: number, status: OfferteStatus): Promise<Offerte> =>
    window.api.updateOfferteStatus(id, status),
  delete: (id: number): Promise<boolean> => window.api.deleteOfferte(id),
  converteerNaarFactuur: (id: number): Promise<{ offerte: Offerte; factuurId: number }> =>
    window.api.converteerOfferteNaarFactuur(id),
  markeerVerlopen: (): Promise<number> => window.api.markeerOffertesVerlopen(),

  // PDF
  genereerPdf: (id: number): Promise<{ filePath: string; offerteNummer: string }> =>
    window.api.genereerOffertePdf(id),
  openPdf: (id: number): Promise<{ filePath: string; offerteNummer: string }> =>
    window.api.openOffertePdf(id),
  getPdfBuffer: (id: number): Promise<string> => window.api.getOffertePdfBuffer(id),
  getHtml: (id: number): Promise<string> => window.api.getOfferteHtml(id),
  opslaanPdfAls: (id: number): Promise<{ saved: boolean; filePath?: string }> =>
    window.api.opslaanOffertePdfAls(id),
  openFolder: (): Promise<{ opened: boolean }> => window.api.openOffertesFolder()
}
