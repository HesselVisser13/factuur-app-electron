// src/main/db/migrate.ts

import path from 'path'
import { app } from 'electron'
import fs from 'fs'

interface Migration {
  version: number
  name: string
  sql: string
}

const migrations: Migration[] = [
  // Toekomstige schema-wijzigingen komen hier
]

export function runMigrations(): void {
  // Skip in development - Prisma migrate dev handles it
  if (!app.isPackaged) {
    return
  }

  // Geen migraties = niks doen
  if (migrations.length === 0) {
    return
  }

  const dbPath = getDatabasePath()

  if (!fs.existsSync(dbPath)) {
    return
  }

  try {
    // Lazy import zodat dev mode niet faalt
    const Database = require('better-sqlite3')
    const db = new Database(dbPath)

    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `)

    const row = db.prepare('SELECT MAX(version) as version FROM _migrations').get() as {
      version: number | null
    }
    const currentVersion = row?.version || 0

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        try {
          db.exec(migration.sql)
          db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(
            migration.version,
            migration.name
          )
          console.log(`[Migration] Applied: ${migration.name}`)
        } catch (error) {
          console.error(`[Migration] Failed: ${migration.name}`, error)
          break
        }
      }
    }

    db.close()
  } catch (error) {
    console.error('[Migration] Error:', error)
  }
}

function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'factuur.db')
}
