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
  INSTELLINGEN_SELECT_LOGO: 'instellingen:selectLogo',

  // Klanten
  KLANTEN_GET_ALL: 'klanten:getAll',
  KLANTEN_CREATE: 'klanten:create',
  KLANTEN_UPDATE: 'klanten:update',
  KLANTEN_DELETE: 'klanten:delete',

  // Facturen
  FACTUREN_GET_ALL: 'facturen:getAll',
  FACTUREN_GET_BY_ID: 'facturen:getById',
  FACTUREN_CREATE: 'facturen:create',
  FACTUREN_UPDATE: 'facturen:update',
  FACTUREN_DELETE: 'facturen:delete',
  FACTUREN_UPDATE_STATUS: 'facturen:updateStatus',
  FACTUREN_GET_NEXT_NUMMER: 'facturen:getNextNummer',

  // PDF
  FACTUREN_GENEREER_PDF: 'facturen:genereer-pdf',
  FACTUREN_OPSLAAN_PDF_ALS: 'facturen:opslaan-pdf-als',
  FACTUREN_OPEN_PDF: 'facturen:open-pdf',
  FACTUREN_OPEN_PDF_FOLDER: 'facturen:open-pdf-folder',

  DASHBOARD_GET_STATS: 'dashboard:get-stats',

  APP_GET_VERSION: 'app:getVersion'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
