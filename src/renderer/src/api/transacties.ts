// src/renderer/src/api/transacties.ts

import type { TransactieInput, TransactieUpdate } from '../../../shared/schemas'

export const transactiesApi = {
  list: (van: string, tot: string) => window.api.getTransacties(van, tot),
  create: (input: TransactieInput) => window.api.createTransactie(input),
  update: (input: TransactieUpdate) => window.api.updateTransactie(input),
  delete: (id: number) => window.api.deleteTransactie(id)
}
