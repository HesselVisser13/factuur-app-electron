// src/main/db/client.ts

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client'
import { app } from 'electron'
import path from 'path'

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
    return path.join(process.cwd(), 'dev.db')
  }
  return path.join(app.getPath('userData'), 'factuur.db')
}
