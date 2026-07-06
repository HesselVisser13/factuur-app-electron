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
  FACTUREN_PDF_BUFFER: 'facturen:pdfBuffer',

  // PDF
  FACTUREN_GENEREER_PDF: 'facturen:genereer-pdf',
  FACTUREN_OPSLAAN_PDF_ALS: 'facturen:opslaan-pdf-als',
  FACTUREN_OPEN_PDF: 'facturen:open-pdf',
  FACTUREN_OPEN_PDF_FOLDER: 'facturen:open-pdf-folder',

  DASHBOARD_GET_STATS: 'dashboard:get-stats',
  ADVIES_GET_ALL: 'advies:get-all',

  APP_GET_VERSION: 'app:getVersion',

  // Mail
  MAIL_GET_AUTH_STATUS: 'mail:get-auth-status',
  MAIL_AUTHENTICATE: 'mail:authenticate',
  MAIL_DISCONNECT: 'mail:disconnect',
  MAIL_SEND: 'mail:send',
  MAIL_GET_LOG: 'mail:get-log',
  MAIL_SEND_OFFERTE: 'mail:sendOfferte',
  MAIL_GET_LOG_OFFERTE: 'mail:getLogOfferte',

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
  BELASTING_BEREKEN_INVESTERING: 'belasting:berekenInvestering',

  // Offertes
  OFFERTES_GET_ALL: 'offertes:getAll',
  OFFERTES_GET_BY_ID: 'offertes:getById',
  OFFERTES_GET_NEXT_NUMMER: 'offertes:getNextNummer',
  OFFERTES_CREATE: 'offertes:create',
  OFFERTES_UPDATE: 'offertes:update',
  OFFERTES_UPDATE_STATUS: 'offertes:updateStatus',
  OFFERTES_DELETE: 'offertes:delete',
  OFFERTES_CONVERTEER_NAAR_FACTUUR: 'offertes:converteerNaarFactuur',
  OFFERTES_MARKEER_VERLOPEN: 'offertes:markeerVerlopen',
  OFFERTES_GENEREER_PDF: 'offertes:genereerPdf',
  OFFERTES_OPEN_PDF: 'offertes:openPdf',
  OFFERTES_PDF_BUFFER: 'offertes:pdfBuffer',
  OFFERTES_OPSLAAN_PDF_ALS: 'offertes:opslaanPdfAls',
  OFFERTES_OPEN_FOLDER: 'offertes:openFolder',
  OFFERTES_GENEREER_HTML: 'offertes:genereerHtml'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
