// src/preload/index.ts

import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type {
  TransactieInput,
  TransactieUpdate,
  KlantInput,
  KlantUpdate,
  FactuurInput,
  FactuurUpdate,
  FactuurStatus
} from '../shared/schemas'
import type {
  BtwAangifte,
  BtwTarief,
  Transactie,
  Klant,
  Factuur,
  PdfResult,
  PdfSaveAsResult,
  PdfOpenResult,
  PdfOpenFolderResult,
  DashboardStats,
  AddFotoInput,
  FotoRecord,
  BackupManifest,
  BackupResult,
  RestoreResult,
  AutoBackupRunResult,
  AutoBackupStatus
} from '../shared/types'
import type { MailAuthStatus, MailResult, MailLogEntry } from '../shared/mail-types'

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

  // Facturen
  getFacturen: (): Promise<Factuur[]> => invoke(IPC_CHANNELS.FACTUREN_GET_ALL),
  getFactuur: (id: number): Promise<Factuur> => invoke(IPC_CHANNELS.FACTUREN_GET_BY_ID, id),
  createFactuur: (input: FactuurInput): Promise<Factuur> =>
    invoke(IPC_CHANNELS.FACTUREN_CREATE, input),
  updateFactuur: (input: FactuurUpdate): Promise<Factuur> =>
    invoke(IPC_CHANNELS.FACTUREN_UPDATE, input),
  deleteFactuur: (id: number): Promise<boolean> => invoke(IPC_CHANNELS.FACTUREN_DELETE, id),
  updateFactuurStatus: (id: number, status: FactuurStatus): Promise<Factuur> =>
    invoke(IPC_CHANNELS.FACTUREN_UPDATE_STATUS, { id, status }),
  getNextFactuurNummer: (datum?: string): Promise<string> =>
    invoke(IPC_CHANNELS.FACTUREN_GET_NEXT_NUMMER, datum),

  // PDF
  genereerFactuurPdf: (id: number): Promise<PdfResult> =>
    invoke(IPC_CHANNELS.FACTUREN_GENEREER_PDF, id),
  opslaanFactuurPdfAls: (id: number): Promise<PdfSaveAsResult> =>
    invoke(IPC_CHANNELS.FACTUREN_OPSLAAN_PDF_ALS, id),
  openFactuurPdf: (id: number): Promise<PdfOpenResult> =>
    invoke(IPC_CHANNELS.FACTUREN_OPEN_PDF, id),
  openFacturenFolder: (): Promise<PdfOpenFolderResult> =>
    invoke(IPC_CHANNELS.FACTUREN_OPEN_PDF_FOLDER),

  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> => invoke(IPC_CHANNELS.DASHBOARD_GET_STATS),

  // Mail
  getMailAuthStatus: (): Promise<MailAuthStatus> => invoke(IPC_CHANNELS.MAIL_GET_AUTH_STATUS),
  authenticateMail: (): Promise<MailAuthStatus> => invoke(IPC_CHANNELS.MAIL_AUTHENTICATE),
  disconnectMail: (): Promise<void> => invoke(IPC_CHANNELS.MAIL_DISCONNECT),
  sendMail: (request: {
    factuurId: number
    ontvanger: string
    onderwerp: string
    body: string
  }): Promise<MailResult> => invoke(IPC_CHANNELS.MAIL_SEND, request),
  getMailLog: (factuurId: number): Promise<MailLogEntry[]> =>
    invoke(IPC_CHANNELS.MAIL_GET_LOG, factuurId),

  // Foto's
  listFotosByKlant: (klantId: number): Promise<FotoRecord[]> =>
    invoke(IPC_CHANNELS.FOTOS_LIST_BY_KLANT, klantId),
  pickFotoFiles: (): Promise<string[]> => invoke(IPC_CHANNELS.FOTOS_PICK_FILES),
  addFoto: (input: AddFotoInput): Promise<FotoRecord> => invoke(IPC_CHANNELS.FOTOS_ADD, input),
  updateFotoNotitie: (id: number, notitie: string | null): Promise<FotoRecord> =>
    invoke(IPC_CHANNELS.FOTOS_UPDATE_NOTITIE, { id, notitie }),
  deleteFoto: (id: number): Promise<boolean> => invoke(IPC_CHANNELS.FOTOS_DELETE, id),
  openFotoExternal: (id: number): Promise<boolean> => invoke(IPC_CHANNELS.FOTOS_OPEN_EXTERNAL, id),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  // Backup
  pickBackupSaveLocation: (): Promise<string | null> =>
    invoke(IPC_CHANNELS.BACKUP_PICK_SAVE_LOCATION),
  pickBackupOpenLocation: (): Promise<string | null> =>
    invoke(IPC_CHANNELS.BACKUP_PICK_OPEN_LOCATION),
  createBackup: (targetPath: string): Promise<BackupResult> =>
    invoke(IPC_CHANNELS.BACKUP_CREATE, targetPath),
  inspectBackup: (zipPath: string): Promise<BackupManifest> =>
    invoke(IPC_CHANNELS.BACKUP_INSPECT, zipPath),
  restoreBackup: (zipPath: string): Promise<RestoreResult> =>
    invoke(IPC_CHANNELS.BACKUP_RESTORE, zipPath),
  relaunchAfterRestore: (): void => ipcRenderer.send('backup:relaunch'),
  getAutoBackupStatus: (): Promise<AutoBackupStatus> => invoke(IPC_CHANNELS.BACKUP_GET_AUTO_STATUS),
  runAutoBackupNow: (): Promise<AutoBackupRunResult> => invoke(IPC_CHANNELS.BACKUP_RUN_AUTO_NOW),
  pickBackupFolder: (): Promise<string | null> => invoke(IPC_CHANNELS.BACKUP_PICK_FOLDER),

  getAppVersion: (): Promise<string> => invoke(IPC_CHANNELS.APP_GET_VERSION)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
