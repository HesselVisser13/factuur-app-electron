// src/renderer/src/api/backup.ts

import type {
  AutoBackupRunResult,
  AutoBackupStatus,
  BackupManifest,
  BackupResult,
  RestoreResult
} from '@shared/types'

export const backupApi = {
  pickSaveLocation: (): Promise<string | null> => window.api.pickBackupSaveLocation(),
  pickOpenLocation: (): Promise<string | null> => window.api.pickBackupOpenLocation(),
  create: (targetPath: string): Promise<BackupResult> => window.api.createBackup(targetPath),
  inspect: (zipPath: string): Promise<BackupManifest> => window.api.inspectBackup(zipPath),
  restore: (zipPath: string): Promise<RestoreResult> => window.api.restoreBackup(zipPath),
  relaunch: (): void => window.api.relaunchAfterRestore(),
  getAutoStatus: (): Promise<AutoBackupStatus> => window.api.getAutoBackupStatus(),
  runAutoNow: (): Promise<AutoBackupRunResult> => window.api.runAutoBackupNow(),
  pickFolder: (): Promise<string | null> => window.api.pickBackupFolder()
}
