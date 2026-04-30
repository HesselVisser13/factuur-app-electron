// src/main/db/client.ts

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let prisma: PrismaClient | null = null

export function getDatabase(): PrismaClient {
  if (prisma) return prisma

  const dbPath = getDatabasePath()
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
  prisma = new PrismaClient({ adapter })

  return prisma
}

function getDatabasePath(): string {
  if (!app.isPackaged) {
    // Development: project root
    return path.join(process.cwd(), 'dev.db')
  }

  // Productie: in gebruikers app data map
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'factuur.db')

  // Als de database nog niet bestaat, kopieer de meegeleverde versie
  if (!fs.existsSync(dbPath)) {
    const sourceDb = path.join(process.resourcesPath, 'dev.db')
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath)
    }
  }

  return dbPath
}
