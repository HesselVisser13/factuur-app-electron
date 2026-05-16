// src/main/services/backup/auto-backup.service.ts

import { existsSync, readdirSync, statSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { log } from '../../logger'
import { getDatabase } from '../../db/client'
import { BACKUP_FILENAME_PREFIX } from '../../../shared/constants'

import {
  AUTO_BACKUP_CONSTANTS,
  getEffectiveBackupFolder,
  readConfig,
  recordFailure,
  resetFailureCounter
} from './auto-backup-config'
import { createBackup, suggestBackupFilename } from './backup.service'

export interface AutoBackupResult {
  ran: boolean
  success?: boolean
  filePath?: string
  bytes?: number
  reason?: string // waarom niet gerund (skipped)
  errorMsg?: string
}

/**
 * Wordt aangeroepen bij app-start.
 * Maakt automatische backup als:
 * - Feature is enabled
 * - Folder is bereikbaar
 * - Laatste auto-backup > 24 uur geleden (of geen)
 *
 * Faalt silent — fouten worden gelogd en geregistreerd, maar app start gewoon door.
 */
export async function maybeRunAutoBackup(): Promise<AutoBackupResult> {
  try {
    const config = await readConfig()

    if (!config.enabled) {
      return { ran: false, reason: 'disabled' }
    }

    if (config.consecutiveFailures >= AUTO_BACKUP_CONSTANTS.MAX_CONSECUTIVE_FAILURES) {
      return { ran: false, reason: 'too_many_failures' }
    }

    const lastBackup = await getLastAutoBackupTime()
    const minIntervalMs = AUTO_BACKUP_CONSTANTS.MIN_INTERVAL_HOURS * 60 * 60 * 1000
    if (lastBackup && Date.now() - lastBackup.getTime() < minIntervalMs) {
      const hoursAgo = ((Date.now() - lastBackup.getTime()) / 1000 / 60 / 60).toFixed(1)
      log.info(`[auto-backup] Skip: laatste backup was ${hoursAgo}u geleden`)
      return { ran: false, reason: 'too_recent' }
    }

    log.info('[auto-backup] Start auto-backup')
    return await runAutoBackup()
  } catch (err) {
    log.error('[auto-backup] Onverwachte fout', err)
    if (err instanceof Error) {
      log.error('[auto-backup] Stack:', err.stack)
    }
    return {
      ran: true,
      success: false,
      errorMsg: err instanceof Error ? err.message : 'Onbekende fout'
    }
  }
}

/**
 * Lees laatste succesvolle auto-backup uit BackupLog.
 */
export async function getLastAutoBackupTime(): Promise<Date | null> {
  const prisma = getDatabase()
  const last = await prisma.backupLog.findFirst({
    where: { type: 'auto', status: 'success' },
    orderBy: { createdAt: 'desc' }
  })
  return last?.createdAt ?? null
}

/**
 * Lees laatste backup van **elk type** (auto + manual).
 * Voor de UI: "laatste backup: ..."
 */
export async function getLastBackupTime(): Promise<Date | null> {
  const prisma = getDatabase()
  const last = await prisma.backupLog.findFirst({
    where: { status: 'success' },
    orderBy: { createdAt: 'desc' }
  })
  return last?.createdAt ?? null
}

// ============================================================
// Internals
// ============================================================

async function runAutoBackup(): Promise<AutoBackupResult> {
  const prisma = getDatabase()
  let folder: string

  try {
    folder = await getEffectiveBackupFolder()
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Folder niet bereikbaar'
    log.error('[auto-backup] Folder fout', err)
    await prisma.backupLog.create({
      data: { type: 'auto', status: 'failed', errorMsg }
    })
    await recordFailure()
    return { ran: true, success: false, errorMsg }
  }

  const filename = suggestBackupFilename()
  const targetPath = join(folder, filename)

  try {
    const result = await createBackup(targetPath)

    await prisma.backupLog.create({
      data: {
        type: 'auto',
        status: 'success',
        filePath: result.filePath,
        bytes: result.bytes
      }
    })

    await resetFailureCounter()

    // Cleanup oude backups (retentie)
    await cleanupOldBackups(folder)

    log.info(
      `[auto-backup] Voltooid: ${result.filePath} (${(result.bytes / 1024 / 1024).toFixed(2)} MB)`
    )

    return {
      ran: true,
      success: true,
      filePath: result.filePath,
      bytes: result.bytes
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Onbekende fout'
    log.error('[auto-backup] Backup mislukt', err)

    // TIJDELIJK: log de hele error voor debugging
    if (err instanceof Error) {
      log.error('[auto-backup] Error name:', err.name)
      log.error('[auto-backup] Error message:', err.message)
      log.error('[auto-backup] Error stack:', err.stack)
    } else {
      log.error('[auto-backup] Non-Error thrown:', JSON.stringify(err))
    }
    await prisma.backupLog.create({
      data: { type: 'auto', status: 'failed', errorMsg }
    })

    const failures = await recordFailure()
    log.warn(`[auto-backup] ${failures} opeenvolgende fouten`)

    return { ran: true, success: false, errorMsg }
  }
}

/**
 * Verwijder oude auto-backup files in folder, behoud alleen de laatste N.
 * Werkt op basis van bestandsnaam-pattern + creation date.
 */
async function cleanupOldBackups(folder: string): Promise<void> {
  if (!existsSync(folder)) return

  try {
    const files = readdirSync(folder)
      .filter((f) => f.startsWith(BACKUP_FILENAME_PREFIX) && f.endsWith('.zip'))
      .map((f) => {
        const fullPath = join(folder, f)
        return {
          name: f,
          path: fullPath,
          mtime: statSync(fullPath).mtime
        }
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

    const toDelete = files.slice(AUTO_BACKUP_CONSTANTS.MAX_BACKUPS_RETAINED)

    for (const file of toDelete) {
      try {
        await unlink(file.path)
        log.info(`[auto-backup] Oude backup verwijderd: ${file.name}`)
      } catch (err) {
        log.warn(`[auto-backup] Kon oude backup niet verwijderen: ${file.name}`, err)
      }
    }
  } catch (err) {
    log.warn('[auto-backup] Cleanup mislukt', err)
  }
}

export async function runAutoBackupForced(): Promise<AutoBackupResult> {
  log.info('[auto-backup] Manuele forced run')
  return runAutoBackup()
}
