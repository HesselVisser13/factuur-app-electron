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

export function getKlantFotosDir(klantId: number): string {
  const dir = join(app.getPath('userData'), 'klant-fotos', String(klantId))
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getKlantFotoThumbsDir(klantId: number): string {
  const dir = join(app.getPath('userData'), 'klant-fotos', String(klantId), '.thumbs')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getKlantFotoPath(klantId: number, filename: string): string {
  return join(getKlantFotosDir(klantId), filename)
}

export function getKlantFotoThumbPath(klantId: number, filename: string): string {
  return join(getKlantFotoThumbsDir(klantId), filename)
}

export function getOffertesDir(): string {
  const dir = join(app.getPath('userData'), 'offertes')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function getOffertePdfPath(offerteNummer: string): string {
  // Sanitize: vervang slashes en andere onveilige chars
  const safe = offerteNummer.replace(/[/\\?%*:|"<>]/g, '-')
  return join(getOffertesDir(), `${safe}.pdf`)
}
