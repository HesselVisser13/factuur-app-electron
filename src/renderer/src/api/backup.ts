// src/renderer/src/api/backup.ts

import type { BackupManifest, BackupResult, RestoreResult } from '@shared/types'

export const backupApi = {
  pickSaveLocation: (): Promise<string | null> => window.api.pickBackupSaveLocation(),
  pickOpenLocation: (): Promise<string | null> => window.api.pickBackupOpenLocation(),
  create: (targetPath: string): Promise<BackupResult> => window.api.createBackup(targetPath),
  inspect: (zipPath: string): Promise<BackupManifest> => window.api.inspectBackup(zipPath),
  restore: (zipPath: string): Promise<RestoreResult> => window.api.restoreBackup(zipPath),
  relaunch: (): void => window.api.relaunchAfterRestore()
}
