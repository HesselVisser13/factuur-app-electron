// src/main/services/backup/auto-backup-config.ts

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { app } from 'electron'

import { getDatabase } from '../../db/client'
import { log } from '../../logger'

const SETTING_ENABLED = 'backup_auto_enabled'
const SETTING_FOLDER = 'backup_auto_folder'

const MAX_CONSECUTIVE_FAILURES = 3

export interface AutoBackupConfig {
  enabled: boolean
  folder: string
  consecutiveFailures: number
}

/** Default folder voor auto-backups: Documents/BTW App backups/ */
export function getDefaultBackupFolder(): string {
  return join(app.getPath('documents'), 'BTW App backups')
}

/** Zorgt dat de folder bestaat, return het effectieve pad. */
export async function getEffectiveBackupFolder(): Promise<string> {
  const config = await readConfig()
  const folder = config.folder.trim() || getDefaultBackupFolder()

  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true })
    log.info(`[auto-backup] Folder aangemaakt: ${folder}`)
  }

  return folder
}

export async function readConfig(): Promise<AutoBackupConfig> {
  const prisma = getDatabase()
  const settings = await prisma.instelling.findMany({
    where: {
      key: { in: [SETTING_ENABLED, SETTING_FOLDER, 'backup_auto_failures'] }
    }
  })

  const map = new Map(settings.map((s) => [s.key, s.value]))

  return {
    enabled: map.get(SETTING_ENABLED) === 'true',
    folder: map.get(SETTING_FOLDER) ?? '',
    consecutiveFailures: parseInt(map.get('backup_auto_failures') ?? '0', 10) || 0
  }
}

export async function recordFailure(): Promise<number> {
  const config = await readConfig()
  const newCount = config.consecutiveFailures + 1
  await setSetting('backup_auto_failures', String(newCount))

  if (newCount >= MAX_CONSECUTIVE_FAILURES) {
    log.warn(`[auto-backup] ${newCount} opeenvolgende fouten — auto-backup uitgeschakeld`)
    await setSetting(SETTING_ENABLED, 'false')
  }

  return newCount
}

export async function resetFailureCounter(): Promise<void> {
  await setSetting('backup_auto_failures', '0')
}

async function setSetting(key: string, value: string): Promise<void> {
  const prisma = getDatabase()
  await prisma.instelling.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  })
}

export const AUTO_BACKUP_CONSTANTS = {
  MIN_INTERVAL_HOURS: 24,
  MAX_BACKUPS_RETAINED: 7,
  MAX_CONSECUTIVE_FAILURES
} as const
