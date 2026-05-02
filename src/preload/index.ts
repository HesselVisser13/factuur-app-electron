// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { TransactieInput, TransactieUpdate, KlantInput, KlantUpdate } from '../shared/schemas'
import type { BtwAangifte, BtwTarief, Transactie, Klant } from '../shared/types'

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = await ipcRenderer.invoke(channel, ...args)

  if (result && typeof result === 'object' && 'success' in result) {
    if (!result.success) {
      throw new Error(result.error || 'Onbekende fout')
    }
    return result.data as T
  }

  return result as T
}

const api = {
  // Transacties
  getTransacties: (van: string, tot: string): Promise<Transactie[]> =>
    invoke(IPC_CHANNELS.TRANSACTIES_GET_BY_PERIODE, van, tot),
  createTransactie: (input: TransactieInput): Promise<Transactie> =>
    invoke(IPC_CHANNELS.TRANSACTIES_CREATE, input),
  deleteTransactie: (id: number): Promise<void> => invoke(IPC_CHANNELS.TRANSACTIES_DELETE, id),
  updateTransactie: (input: TransactieUpdate): Promise<Transactie> =>
    invoke(IPC_CHANNELS.TRANSACTIES_UPDATE, input),

  // BTW-aangifte
  getBtwAangifte: (kwartaal: number, jaar: number): Promise<BtwAangifte> =>
    invoke(IPC_CHANNELS.BTW_AANGIFTE_GENEREER, kwartaal, jaar),

  // BTW-tarieven
  getBtwTarieven: (): Promise<BtwTarief[]> => invoke(IPC_CHANNELS.BTW_TARIEVEN_GET_ACTIEF),

  // Instellingen
  getInstellingen: (): Promise<Record<string, string>> => invoke(IPC_CHANNELS.INSTELLINGEN_GET_ALL),
  saveInstellingen: (data: Record<string, string>): Promise<boolean> =>
    invoke(IPC_CHANNELS.INSTELLINGEN_SAVE, data),
  selectLogo: (): Promise<{ fileName: string; originalName: string } | null> =>
    invoke(IPC_CHANNELS.INSTELLINGEN_SELECT_LOGO),

  // Klanten
  getKlanten: (): Promise<Klant[]> => invoke(IPC_CHANNELS.KLANTEN_GET_ALL),
  createKlant: (input: KlantInput): Promise<Klant> => invoke(IPC_CHANNELS.KLANTEN_CREATE, input),
  updateKlant: (input: KlantUpdate): Promise<Klant> => invoke(IPC_CHANNELS.KLANTEN_UPDATE, input),
  deleteKlant: (id: number): Promise<boolean> => invoke(IPC_CHANNELS.KLANTEN_DELETE, id),

  getAppVersion: (): Promise<string> => invoke(IPC_CHANNELS.APP_GET_VERSION)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
