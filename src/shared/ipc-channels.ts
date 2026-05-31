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
  BTW_TARIEVEN_CREATE: 'btwTarieven:create',
  BTW_TARIEVEN_UPDATE: 'btwTarieven:update',
  BTW_TARIEVEN_DELETE: 'btwTarieven:delete',

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

  APP_GET_VERSION: 'app:getVersion',

  // Mail
  MAIL_GET_AUTH_STATUS: 'mail:get-auth-status',
  MAIL_AUTHENTICATE: 'mail:authenticate',
  MAIL_DISCONNECT: 'mail:disconnect',
  MAIL_SEND: 'mail:send',
  MAIL_GET_LOG: 'mail:get-log',

  //fotos
  FOTOS_LIST_BY_KLANT: 'fotos:listByKlant',
  FOTOS_ADD: 'fotos:add',
  FOTOS_UPDATE_NOTITIE: 'fotos:updateNotitie',
  FOTOS_DELETE: 'fotos:delete',
  FOTOS_PICK_FILES: 'fotos:pickFiles',
  FOTOS_OPEN_EXTERNAL: 'fotos:openExternal',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_INSPECT: 'backup:inspect',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_PICK_SAVE_LOCATION: 'backup:pickSaveLocation',
  BACKUP_PICK_OPEN_LOCATION: 'backup:pickOpenLocation',
  BACKUP_GET_AUTO_STATUS: 'backup:getAutoStatus',
  BACKUP_RUN_AUTO_NOW: 'backup:runAutoNow',
  BACKUP_PICK_FOLDER: 'backup:pickFolder',

  //cahsflow
  CASHFLOW_GET_OVERVIEW: 'cashflow:getOverview',

  // Belasting
  BELASTING_BEREKEN: 'belasting:bereken',
  BELASTING_BEREKEN_INVESTERING: 'belasting:berekenInvestering'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
