// src/main/paths.ts

import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

export function getFacturenDir(): string {
  const dir = join(app.getPath('userData'), 'facturen')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function getLogosDir(): string {
  const dir = join(app.getPath('userData'), 'logos')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function getFactuurPdfPath(factuurNummer: string): string {
  return join(getFacturenDir(), `${factuurNummer}.pdf`)
}

export function getLogoPath(fileName: string): string {
  return join(getLogosDir(), fileName)
}
