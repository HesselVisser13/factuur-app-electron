// src/preload/index.d.ts

import type { BtwAangifte, BtwTarief, Transactie, TransactieInput } from '../shared/types'

declare global {
  interface Window {
    api: {
      getTransacties: (van: string, tot: string) => Promise<Transactie[]>
      createTransactie: (input: TransactieInput) => Promise<Transactie>
      deleteTransactie: (id: number) => Promise<void>
      getBtwAangifte: (kwartaal: number, jaar: number) => Promise<BtwAangifte>
      getBtwTarieven: () => Promise<BtwTarief[]>
      getInstellingen: () => Promise<Record<string, string>>
      saveInstellingen: (data: Record<string, string>) => Promise<boolean>
    }
  }
}
