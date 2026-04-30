// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'
import type { TransactieInput } from '../shared/types'

const api = {
  // Transacties
  getTransacties: (van: string, tot: string) =>
    ipcRenderer.invoke('transacties:getByPeriode', van, tot),
  createTransactie: (input: TransactieInput) => ipcRenderer.invoke('transacties:create', input),
  deleteTransactie: (id: number) => ipcRenderer.invoke('transacties:delete', id),

  // BTW-aangifte
  getBtwAangifte: (kwartaal: number, jaar: number) =>
    ipcRenderer.invoke('btwAangifte:genereer', kwartaal, jaar),

  // BTW-tarieven
  getBtwTarieven: () => ipcRenderer.invoke('btwTarieven:getActief')
}

contextBridge.exposeInMainWorld('api', api)
