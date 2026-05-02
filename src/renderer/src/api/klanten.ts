import type { KlantInput, KlantUpdate } from '../../../shared/schemas'

export const klantenApi = {
  getAll: () => window.api.getKlanten(),
  create: (input: KlantInput) => window.api.createKlant(input),
  update: (input: KlantUpdate) => window.api.updateKlant(input),
  delete: (id: number) => window.api.deleteKlant(id)
}
