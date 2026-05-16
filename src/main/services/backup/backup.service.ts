// src/main/services/backup/backup.service.ts

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import AdmZip from 'adm-zip'
import { app } from 'electron'

import {
  BACKUP_FILENAME_PREFIX,
  BACKUP_FORMAT_VERSION,
  BACKUP_MANIFEST_FILENAME
} from '../../../shared/constants'
import { getDatabase } from '../../db/client'
import { log } from '../../logger'
import { getFacturenDir, getLogosDir } from '../../paths'

import type { BackupManifest, BackupResult } from './backup-types'

/**
 * Maakt een volledige backup van alle data in een ZIP-bestand.
 *
 * Inhoud:
 * - database.db: SQLite snapshot via VACUUM INTO
 * - logos/: alle logo-bestanden
 * - facturen/: alle factuur-PDFs
 * - klant-fotos/: alle foto-folders per klant (incl. .thumbs)
 * - backup-manifest.json: versie + metadata
 */
export async function createBackup(targetPath: string): Promise<BackupResult> {
  log.info(`[backup] Start: ${targetPath}`)

  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'factuur.db')

  if (!existsSync(dbPath)) {
    throw new Error('Database-bestand niet gevonden. Mogelijk is de app nog niet geïnitialiseerd.')
  }

  // 1. Maak een consistent snapshot van de database (VACUUM INTO)
  const tempDbPath = join(userDataPath, '.backup-temp.db')
  await snapshotDatabase(tempDbPath)

  try {
    // 2. Verzamel manifest
    const manifest = await buildManifest()

    // 3. Bouw ZIP
    writeZip(targetPath, tempDbPath, manifest, userDataPath)

    const stats = statSync(targetPath)
    log.info(`[backup] Voltooid: ${targetPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)

    return {
      filePath: targetPath,
      bytes: stats.size,
      manifest
    }
  } finally {
    await safeDelete(tempDbPath)
  }
}

export function suggestBackupFilename(): string {
  const now = new Date()
  const datum = now.toISOString().slice(0, 10) // YYYY-MM-DD
  const tijd = now.toTimeString().slice(0, 5).replace(':', '') // HHMM
  return `${BACKUP_FILENAME_PREFIX}-${datum}-${tijd}.zip`
}

// ============================================================
// Internals
// ============================================================

async function snapshotDatabase(targetDbPath: string): Promise<void> {
  await safeDelete(targetDbPath)

  const prisma = getDatabase()
  const safePath = targetDbPath.replace(/'/g, "''")
  await prisma.$executeRawUnsafe(`VACUUM INTO '${safePath}'`)

  if (!existsSync(targetDbPath)) {
    throw new Error('Database-snapshot maken mislukt')
  }
  log.info('[backup] DB-snapshot gemaakt')
}

async function buildManifest(): Promise<BackupManifest> {
  const prisma = getDatabase()
  const [klanten, facturen, transacties, fotos] = await Promise.all([
    prisma.klant.count(),
    prisma.factuur.count(),
    prisma.transactie.count(),
    prisma.foto.count()
  ])

  const facturenDir = getFacturenDir()
  let factuurPdfs = 0
  if (existsSync(facturenDir)) {
    factuurPdfs = readdirSync(facturenDir).filter((f) => f.endsWith('.pdf')).length
  }

  const logosDir = getLogosDir()
  let hasLogo = false
  if (existsSync(logosDir)) {
    hasLogo = readdirSync(logosDir).length > 0
  }

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: app.getVersion(),
    createdAt: new Date().toISOString(),
    contents: {
      klanten,
      facturen,
      transacties,
      fotos,
      factuurPdfs,
      hasLogo
    }
  }
}

function writeZip(
  targetPath: string,
  tempDbPath: string,
  manifest: BackupManifest,
  userDataPath: string
): void {
  const zip = new AdmZip()

  // 1. Manifest
  zip.addFile(BACKUP_MANIFEST_FILENAME, Buffer.from(JSON.stringify(manifest, null, 2)))

  // 2. Database
  zip.addLocalFile(tempDbPath, '', 'database.db')

  // 3. Logos folder
  const logosDir = join(userDataPath, 'logos')
  if (existsSync(logosDir)) {
    zip.addLocalFolder(logosDir, 'logos')
  }

  // 4. Facturen folder
  const facturenDir = join(userDataPath, 'facturen')
  if (existsSync(facturenDir)) {
    zip.addLocalFolder(facturenDir, 'facturen')
  }

  // 5. Klant-fotos folder
  const fotosDir = join(userDataPath, 'klant-fotos')
  if (existsSync(fotosDir)) {
    zip.addLocalFolder(fotosDir, 'klant-fotos')
  }

  // Schrijf naar disk
  zip.writeZip(targetPath)
}

async function safeDelete(path: string): Promise<void> {
  try {
    if (existsSync(path)) {
      const { unlink } = await import('node:fs/promises')
      await unlink(path)
    }
  } catch (err) {
    log.warn(`[backup] Cleanup mislukt voor ${path}`, err)
  }
}
