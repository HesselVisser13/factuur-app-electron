// src/main/services/backup/backup-types.ts

/**
 * Manifest-bestand binnen elke backup-ZIP.
 * Wordt gebruikt voor versie-validatie en metadata bij restore.
 */
export interface BackupManifest {
  /** Format-versie van deze backup (zie BACKUP_FORMAT_VERSION). */
  formatVersion: number
  /** App-versie die de backup heeft gemaakt (bv. "1.4.1"). */
  appVersion: string
  /** ISO-datum wanneer de backup is gemaakt. */
  createdAt: string
  /** Statistieken over wat erin zit (voor display). */
  contents: {
    klanten: number
    facturen: number
    transacties: number
    fotos: number
    factuurPdfs: number
    hasLogo: boolean
  }
}

export interface BackupResult {
  filePath: string
  bytes: number
  manifest: BackupManifest
}

export interface RestoreResult {
  manifest: BackupManifest
  rolledBack: boolean
}

export interface BackupStats {
  lastBackupAt: string | null
  lastBackupPath: string | null
}
