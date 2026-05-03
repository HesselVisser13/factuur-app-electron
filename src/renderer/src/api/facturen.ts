// src/renderer/src/api/facturen.ts

import type { FactuurInput, FactuurUpdate, FactuurStatus } from '../../../shared/schemas'

export const facturenApi = {
  getAll: () => window.api.getFacturen(),
  getById: (id: number) => window.api.getFactuur(id),
  create: (input: FactuurInput) => window.api.createFactuur(input),
  update: (input: FactuurUpdate) => window.api.updateFactuur(input),
  delete: (id: number) => window.api.deleteFactuur(id),
  updateStatus: (id: number, status: FactuurStatus) => window.api.updateFactuurStatus(id, status),
  getNextNummer: (datum?: string) => window.api.getNextFactuurNummer(datum),
  genereerPdf: (id: number) => window.api.genereerFactuurPdf(id),
  opslaanPdfAls: (id: number) => window.api.opslaanFactuurPdfAls(id),
  openPdf: (id: number) => window.api.openFactuurPdf(id),
  openFolder: () => window.api.openFacturenFolder()
}
