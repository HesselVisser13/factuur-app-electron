// src/main/services/backup/restore.service.ts

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { copyFile, cp, mkdir, readdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'

import AdmZip from 'adm-zip'
import { app } from 'electron'

import { BACKUP_FORMAT_VERSION, BACKUP_MANIFEST_FILENAME } from '../../../shared/constants'
import { log } from '../../logger'

import { createBackup } from './backup.service'
import type { BackupManifest, RestoreResult } from './backup-types'

const STAGING_FOLDER = '.restore-staging'
const MARKER_FILE = '.restore-pending.json'
const SAFETY_BACKUP = '.pre-restore-backup.zip'

interface PendingRestore {
  stagingPath: string
  manifestVersion: number
  createdAt: string
}

/**
 * Inspecteert een backup-ZIP en geeft het manifest terug.
 */
export async function inspectBackup(zipPath: string): Promise<BackupManifest> {
  if (!existsSync(zipPath)) {
    throw new Error('Backup-bestand niet gevonden')
  }

  const zip = new AdmZip(zipPath)
  const manifestEntry = zip.getEntry(BACKUP_MANIFEST_FILENAME)

  if (!manifestEntry) {
    throw new Error(
      'Dit is geen geldig BTW App backup-bestand (manifest ontbreekt). ' +
        'Mogelijk is het corrupt of een ander type ZIP.'
    )
  }

  let manifest: BackupManifest
  try {
    const content = manifestEntry.getData().toString('utf-8')
    manifest = JSON.parse(content) as BackupManifest
  } catch {
    throw new Error('Backup-manifest is corrupt of niet leesbaar')
  }

  validateManifest(manifest)
  return manifest
}

/**
 * Bereidt een restore voor: safety-backup, extract naar staging, marker file.
 *
 * NB: De daadwerkelijke file-swap gebeurt op de VOLGENDE app-start via
 * `applyPendingRestore()`. Dit voorkomt file-lock issues op Windows.
 */
export async function prepareRestore(zipPath: string): Promise<RestoreResult> {
  log.info(`[restore] Prepare: ${zipPath}`)

  // 1. Validate
  const manifest = await inspectBackup(zipPath)

  const userDataPath = app.getPath('userData')
  const stagingPath = join(userDataPath, STAGING_FOLDER)
  const markerPath = join(userDataPath, MARKER_FILE)
  const safetyBackupPath = join(userDataPath, SAFETY_BACKUP)

  // 2. Safety-backup van huidige staat
  log.info('[restore] Safety-backup maken...')
  try {
    await createBackup(safetyBackupPath)
    log.info(`[restore] Safety-backup: ${safetyBackupPath}`)
  } catch (err) {
    log.warn('[restore] Safety-backup mislukt — restore gaat door zonder rollback', err)
  }

  // 3. Cleanup oude staging
  if (existsSync(stagingPath)) {
    await rm(stagingPath, { recursive: true, force: true })
  }
  await mkdir(stagingPath, { recursive: true })

  // 4. Extract ZIP naar staging
  log.info('[restore] Extracting naar staging...')
  try {
    await extractBackup(zipPath, stagingPath)
  } catch (err) {
    // Cleanup bij fout
    await rm(stagingPath, { recursive: true, force: true })
    throw new Error(
      `Uitpakken van backup mislukt: ${err instanceof Error ? err.message : 'onbekend'}`
    )
  }

  // 5. Schrijf marker file
  const pending: PendingRestore = {
    stagingPath,
    manifestVersion: manifest.formatVersion,
    createdAt: new Date().toISOString()
  }
  writeFileSync(markerPath, JSON.stringify(pending, null, 2))

  log.info('[restore] Klaar voor relaunch')
  return {
    manifest,
    rolledBack: false
  }
}

/**
 * Wordt aangeroepen op startup, VOORDAT de database wordt geopend.
 * Als er een pending restore is: doe de file-swap.
 *
 * Returnt true als er iets is hersteld, false als er niets te doen was.
 */
export async function applyPendingRestore(): Promise<boolean> {
  const userDataPath = app.getPath('userData')
  const markerPath = join(userDataPath, MARKER_FILE)

  if (!existsSync(markerPath)) {
    return false
  }

  log.info('[restore] Pending restore gedetecteerd')

  let pending: PendingRestore
  try {
    const content = readFileSync(markerPath, 'utf-8')
    pending = JSON.parse(content) as PendingRestore
  } catch (err) {
    log.error('[restore] Marker corrupt, weggooien', err)
    await rm(markerPath, { force: true })
    return false
  }

  if (!existsSync(pending.stagingPath)) {
    log.error('[restore] Staging folder ontbreekt, marker verwijderen')
    await rm(markerPath, { force: true })
    return false
  }

  try {
    // 1. Wipe huidige data (nu nog geen file-locks!)
    log.info('[restore] Huidige data wissen...')
    await wipeUserData(userDataPath)

    // 2. Move staging → userData (atomic via rename waar mogelijk)
    log.info('[restore] Staging → userData verplaatsen...')
    await moveStagingIntoUserData(pending.stagingPath, userDataPath)

    // 3. Cleanup
    await rm(pending.stagingPath, { recursive: true, force: true })
    await rm(markerPath, { force: true })

    log.info('[restore] Pending restore voltooid')
    return true
  } catch (err) {
    log.error('[restore] Pending restore mislukt', err)
    // Marker weghalen zodat user normaal kan starten met huidige data
    // Safety-backup blijft staan voor handmatige recovery
    await rm(markerPath, { force: true })
    throw new Error(
      `Backup terugzetten mislukt: ${err instanceof Error ? err.message : 'onbekend'}. ` +
        `Een safety-backup van je oude data staat in: ${join(userDataPath, SAFETY_BACKUP)}`
    )
  }
}

// ============================================================
// Internals
// ============================================================

function validateManifest(manifest: unknown): asserts manifest is BackupManifest {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Backup-manifest is leeg of ongeldig')
  }
  const m = manifest as Partial<BackupManifest>

  if (typeof m.formatVersion !== 'number') {
    throw new Error('Backup-manifest mist formatVersion')
  }

  if (m.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Deze backup is gemaakt met een nieuwere app-versie ` +
        `(format ${m.formatVersion}, deze app ondersteunt ${BACKUP_FORMAT_VERSION}). ` +
        `Update de app om deze backup te kunnen herstellen.`
    )
  }

  if (!m.appVersion || !m.createdAt) {
    throw new Error('Backup-manifest is incompleet')
  }
}

async function wipeUserData(userDataPath: string): Promise<void> {
  const targets = [
    join(userDataPath, 'factuur.db'),
    join(userDataPath, 'factuur.db-journal'),
    join(userDataPath, 'factuur.db-wal'),
    join(userDataPath, 'factuur.db-shm'),
    join(userDataPath, 'logos'),
    join(userDataPath, 'facturen'),
    join(userDataPath, 'klant-fotos')
  ]

  for (const target of targets) {
    if (existsSync(target)) {
      try {
        await rm(target, { recursive: true, force: true })
      } catch (err) {
        log.warn(`[restore] Wipe mislukt voor ${target}`, err)
      }
    }
  }
}

async function extractBackup(zipPath: string, targetPath: string): Promise<void> {
  const zip = new AdmZip(zipPath)
  const entries = zip.getEntries()

  for (const entry of entries) {
    if (entry.entryName === BACKUP_MANIFEST_FILENAME) {
      // Manifest niet uitpakken
      continue
    }

    if (entry.entryName === 'database.db') {
      const dbTarget = join(targetPath, 'factuur.db')
      const buffer = entry.getData()
      writeFileSync(dbTarget, buffer)
      continue
    }

    if (entry.isDirectory) {
      await mkdir(join(targetPath, entry.entryName), { recursive: true })
      continue
    }

    // Bestanden in subdirs
    const fileTarget = join(targetPath, entry.entryName)
    const fileDir = join(fileTarget, '..')
    await mkdir(fileDir, { recursive: true })
    const buffer = entry.getData()
    writeFileSync(fileTarget, buffer)
  }
}

async function moveStagingIntoUserData(stagingPath: string, userDataPath: string): Promise<void> {
  const entries = await readdir(stagingPath)
  for (const entry of entries) {
    const source = join(stagingPath, entry)
    const target = join(userDataPath, entry)

    try {
      // rename = atomic op zelfde filesystem
      await rename(source, target)
    } catch {
      // Fallback: copy + delete (cross-device of permissions)
      log.warn(`[restore] Rename mislukt voor ${entry}, fallback naar copy`)
      const stat = statSync(source)
      if (stat.isDirectory()) {
        await cp(source, target, { recursive: true })
      } else {
        await copyFile(source, target)
      }
      await rm(source, { recursive: true, force: true })
    }
  }
}
