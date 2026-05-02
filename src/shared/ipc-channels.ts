// src/shared/ipc-channels.ts

export const IPC_CHANNELS = {
  // Transacties
  TRANSACTIES_GET_BY_PERIODE: 'transacties:getByPeriode',
  TRANSACTIES_CREATE: 'transacties:create',
  TRANSACTIES_DELETE: 'transacties:delete',
  TRANSACTIES_UPDATE: 'transacties:update',

  // BTW-aangifte
  BTW_AANGIFTE_GENEREER: 'btwAangifte:genereer',

  // BTW-tarieven
  BTW_TARIEVEN_GET_ACTIEF: 'btwTarieven:getActief',

  // Instellingen
  INSTELLINGEN_GET_ALL: 'instellingen:getAll',
  INSTELLINGEN_SAVE: 'instellingen:save',

  APP_GET_VERSION: 'app:getVersion'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
