// src/main/services/mail/token-storage.ts

import { safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { app } from 'electron'

import { log } from '../../logger'

interface StoredTokens {
  refreshToken: string
  email: string
}

/**
 * Beveiligde opslag van OAuth refresh-token + email.
 *
 * - Versleuteld via Electron's safeStorage (Windows DPAPI / macOS Keychain)
 * - Bestand in userData directory (per OS-gebruiker geïsoleerd)
 * - Decryptie kan alleen door dezelfde OS-gebruiker op dezelfde machine
 */

const TOKEN_FILE = 'gmail-tokens.enc'

function getTokenPath(): string {
  return join(app.getPath('userData'), TOKEN_FILE)
}

function ensureDir(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function saveTokens(tokens: StoredTokens): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Veilige opslag is niet beschikbaar op dit systeem. ' +
        'Mail-functionaliteit kan niet veilig worden geconfigureerd.'
    )
  }

  const path = getTokenPath()
  ensureDir(path)

  const json = JSON.stringify(tokens)
  const encrypted = safeStorage.encryptString(json)
  writeFileSync(path, encrypted)
  log.info('[mail] Tokens opgeslagen')
}

export function loadTokens(): StoredTokens | null {
  const path = getTokenPath()
  if (!existsSync(path)) return null

  if (!safeStorage.isEncryptionAvailable()) {
    log.warn('[mail] Veilige opslag niet beschikbaar — tokens kunnen niet gelezen worden')
    return null
  }

  try {
    const encrypted = readFileSync(path)
    const decrypted = safeStorage.decryptString(encrypted)
    return JSON.parse(decrypted) as StoredTokens
  } catch (err) {
    log.error('[mail] Token decryptie mislukt', err)
    return null
  }
}

export function clearTokens(): void {
  const path = getTokenPath()
  if (existsSync(path)) {
    unlinkSync(path)
    log.info('[mail] Tokens verwijderd')
  }
}
