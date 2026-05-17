import type { BtwTariefInput, BtwTariefUpdate } from '@shared/schemas'
import type { BtwTarief } from '@shared/types'

export const btwTarievenApi = {
  getActief: (): Promise<BtwTarief[]> => window.api.getBtwTarieven(),
  create: (input: BtwTariefInput): Promise<BtwTarief> => window.api.createBtwTarief(input),
  update: (input: BtwTariefUpdate): Promise<BtwTarief> => window.api.updateBtwTarief(input),
  delete: (id: number): Promise<boolean> => window.api.deleteBtwTarief(id)
}
