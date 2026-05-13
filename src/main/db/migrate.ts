// src/main/db/migrate.ts

import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { app } from 'electron'

/** Subset van better-sqlite3's Database API die we gebruiken. */
type SqliteDb = {
  exec: (sql: string) => unknown
  prepare: (sql: string) => {
    run: (...params: unknown[]) => unknown
    get: (...params: unknown[]) => unknown
    all: (...params: unknown[]) => unknown[]
  }
  close: () => void
}

interface MigrationRow {
  name: string
}

interface CountRow {
  count: number
}

interface ColumnInfoRow {
  name: string
}

export function runMigrations(): void {
  // Skip in development - Prisma migrate dev handles it
  if (!app.isPackaged) {
    return
  }

  const dbPath = path.join(app.getPath('userData'), 'factuur.db')

  // Copy bundled seed.db if no database exists yet (first install)
  if (!fs.existsSync(dbPath)) {
    const sourceDb = path.join(process.resourcesPath, 'seed.db')
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath)
      console.log('[Migration] Initial database copied from bundle')
    } else {
      console.error('[Migration] No existing database and no bundled template')
      return
    }
  }

  const migrationsDir = path.join(process.resourcesPath, 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.error('[Migration] Migrations folder missing:', migrationsDir)
    return
  }

  const db = new Database(dbPath) as unknown as SqliteDb

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS _app_migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `)

    const migrationFolders = fs
      .readdirSync(migrationsDir)
      .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
      .sort()

    const appliedRows = db.prepare('SELECT name FROM _app_migrations').all() as MigrationRow[]
    const applied = new Set(appliedRows.map((r) => r.name))

    // Baseline: bestaande DB zonder tracking table
    if (applied.size === 0 && hasExistingSchema(db)) {
      const baselineVersion = detectSchemaVersion(db, migrationFolders)
      console.log(`[Migration] Existing database detected, baselining at: ${baselineVersion}`)

      for (const folder of migrationFolders) {
        db.prepare('INSERT INTO _app_migrations (name) VALUES (?)').run(folder)
        applied.add(folder)
        if (folder === baselineVersion) break
      }
    }

    // Apply pending migrations
    for (const folder of migrationFolders) {
      if (applied.has(folder)) continue

      const sqlPath = path.join(migrationsDir, folder, 'migration.sql')
      if (!fs.existsSync(sqlPath)) {
        console.warn(`[Migration] Missing migration.sql in ${folder}`)
        continue
      }

      console.log(`[Migration] Applying: ${folder}`)
      const sql = fs.readFileSync(sqlPath, 'utf-8')

      try {
        db.exec(sql)
        db.prepare('INSERT INTO _app_migrations (name) VALUES (?)').run(folder)
        console.log(`[Migration] Applied: ${folder}`)
      } catch (error) {
        console.error(`[Migration] Failed: ${folder}`, error)
        throw error
      }
    }
  } finally {
    db.close()
  }
}

function hasExistingSchema(db: SqliteDb): boolean {
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('Factuur', 'Transactie', 'BtwTarief')"
    )
    .get() as CountRow
  return row.count > 0
}

function detectSchemaVersion(db: SqliteDb, folders: string[]): string {
  // Latest migration: Klant has 'type' column (particulier/zakelijk)
  if (columnExists(db, 'Klant', 'type')) {
    return folders[2]
  }
  // Middle migration: Klant table + Factuur.klantId
  if (tableExists(db, 'Klant') && columnExists(db, 'Factuur', 'klantId')) {
    return folders[1]
  }
  // Init only
  return folders[0]
}

function tableExists(db: SqliteDb, name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name)
  return !!row
}

function columnExists(db: SqliteDb, table: string, column: string): boolean {
  if (!tableExists(db, table)) return false
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfoRow[]
  return columns.some((c) => c.name === column)
}
