// src/renderer/src/api/fotos.ts

import type { AddFotoInput, FotoRecord } from '@shared/types'

export const fotosApi = {
  listByKlant: (klantId: number): Promise<FotoRecord[]> => window.api.listFotosByKlant(klantId),
  pickFiles: (): Promise<string[]> => window.api.pickFotoFiles(),
  add: (input: AddFotoInput): Promise<FotoRecord> => window.api.addFoto(input),
  updateNotitie: (id: number, notitie: string | null): Promise<FotoRecord> =>
    window.api.updateFotoNotitie(id, notitie),
  delete: (id: number): Promise<boolean> => window.api.deleteFoto(id),
  openExternal: (id: number): Promise<boolean> => window.api.openFotoExternal(id)
}
