// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'

async function invoke<T>(channel: string, ...args: any[]): Promise<T> {
  const result = await ipcRenderer.invoke(channel, ...args)

  if (result && typeof result === 'object' && 'success' in result) {
    if (!result.success) {
      throw new Error(result.error || 'Onbekende fout')
    }
    return result.data as T
  }

  // Fallback voor handlers die geen IpcResult teruggeven
  return result as T
}

const api = {
  // Transacties
  getTransacties: (van: string, tot: string) => invoke('transacties:getByPeriode', van, tot),
  createTransactie: (input: any) => invoke('transacties:create', input),
  deleteTransactie: (id: number) => invoke('transacties:delete', id),

  // BTW-aangifte
  getBtwAangifte: (kwartaal: number, jaar: number) =>
    invoke('btwAangifte:genereer', kwartaal, jaar),

  // BTW-tarieven
  getBtwTarieven: () => invoke('btwTarieven:getActief'),

  // Instellingen
  getInstellingen: () => invoke('instellingen:getAll'),
  saveInstellingen: (data: Record<string, string>) => invoke('instellingen:save', data)
}

contextBridge.exposeInMainWorld('api', api)
