// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'

async function invoke<T>(channel: string, ...args: any[]): Promise<T> {
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
  getTransacties: (van: string, tot: string) =>
    invoke(IPC_CHANNELS.TRANSACTIES_GET_BY_PERIODE, van, tot),
  createTransactie: (input: any) => invoke(IPC_CHANNELS.TRANSACTIES_CREATE, input),
  deleteTransactie: (id: number) => invoke(IPC_CHANNELS.TRANSACTIES_DELETE, id),

  // BTW-aangifte
  getBtwAangifte: (kwartaal: number, jaar: number) =>
    invoke(IPC_CHANNELS.BTW_AANGIFTE_GENEREER, kwartaal, jaar),

  // BTW-tarieven
  getBtwTarieven: () => invoke(IPC_CHANNELS.BTW_TARIEVEN_GET_ACTIEF),

  // Instellingen
  getInstellingen: () => invoke(IPC_CHANNELS.INSTELLINGEN_GET_ALL),
  saveInstellingen: (data: Record<string, string>) => invoke(IPC_CHANNELS.INSTELLINGEN_SAVE, data)
}

contextBridge.exposeInMainWorld('api', api)
