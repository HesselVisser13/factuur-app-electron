// src/main/services/mail/gmail-mail.service.ts

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

import type { MailMessage, MailResult } from '@shared/mail-types'

import { log } from '../../logger'
import { runOAuthFlow } from './oauth-loopback'
import { clearTokens, loadTokens, saveTokens } from './token-storage'
import { getReadableMailError } from './error-mapper'

interface GmailServiceConfig {
  clientId: string
  clientSecret: string
}

/**
 * Verstuurt mails via Gmail API met OAuth.
 *
 * - Tokens worden veilig opgeslagen via safeStorage
 * - Access-token wordt automatisch ge-refreshed door google-auth-library
 * - Bij eerste gebruik moet authenticate() aangeroepen worden
 */
export class GmailMailService {
  private readonly config: GmailServiceConfig
  private oauth2Client: OAuth2Client | null = null

  constructor(config: GmailServiceConfig) {
    this.config = config
  }

  // ============================================================
  // Authenticatie
  // ============================================================

  isConfigured(): boolean {
    return this.config.clientId !== '' && this.config.clientSecret !== ''
  }

  isAuthenticated(): boolean {
    return loadTokens() !== null
  }

  getAuthenticatedEmail(): string | null {
    const tokens = loadTokens()
    return tokens?.email ?? null
  }

  /** Start OAuth flow + slaat tokens op. */
  async authenticate(): Promise<{ email: string }> {
    if (!this.isConfigured()) {
      throw new Error('Gmail credentials ontbreken (.env)')
    }

    const result = await runOAuthFlow({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret
    })

    saveTokens({
      refreshToken: result.refreshToken,
      email: result.email
    })

    this.oauth2Client = null // dwing herinitialisatie
    return { email: result.email }
  }

  /** Verwijdert opgeslagen tokens. */
  disconnect(): void {
    clearTokens()
    this.oauth2Client = null
  }

  // ============================================================
  // Verzenden
  // ============================================================

  async send(message: MailMessage): Promise<MailResult> {
    try {
      const client = this.getOAuthClient()
      const gmail = google.gmail({ version: 'v1', auth: client })
      const raw = buildRawMessage(message)

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
      })

      log.info(`[mail] Mail verzonden naar ${message.to} (id: ${response.data.id})`)
      return {
        success: true,
        messageId: response.data.id ?? undefined
      }
    } catch (err) {
      log.error('[mail] Mail verzenden mislukt', err)
      return {
        success: false,
        error: getReadableMailError(err) // ← was: err instanceof Error ? err.message : 'Onbekende fout'
      }
    }
  }

  // ============================================================
  // Privé
  // ============================================================

  private getOAuthClient(): OAuth2Client {
    if (this.oauth2Client) return this.oauth2Client

    const tokens = loadTokens()
    if (!tokens) {
      throw new Error('Niet geauthenticeerd. Roep eerst authenticate() aan.')
    }

    const client = new OAuth2Client(this.config.clientId, this.config.clientSecret)
    client.setCredentials({ refresh_token: tokens.refreshToken })

    // google-auth-library refresht access_token automatisch zodra hij verloopt
    this.oauth2Client = client
    return client
  }
}

// ============================================================
// MIME builder
// ============================================================

function buildRawMessage(message: MailMessage): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`

  const headers = [
    `To: ${message.to}`,
    `Subject: ${encodeSubject(message.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ]

  const parts: string[] = []

  // Body part
  parts.push(
    [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      message.body
    ].join('\r\n')
  )

  // Attachments
  if (message.attachments) {
    for (const att of message.attachments) {
      const buffer = Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content)
      const base64 = buffer.toString('base64')
      // Knip op 76 karakters per regel (RFC 2045)
      const wrapped = base64.match(/.{1,76}/g)?.join('\r\n') ?? base64

      parts.push(
        [
          `--${boundary}`,
          `Content-Type: ${att.contentType}; name="${att.filename}"`,
          `Content-Disposition: attachment; filename="${att.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          wrapped
        ].join('\r\n')
      )
    }
  }

  parts.push(`--${boundary}--`)

  const message_ = headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n')

  // Gmail wil URL-safe base64 zonder padding
  return Buffer.from(message_)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** RFC 2047 encoding voor subjects met non-ASCII tekens. */
function encodeSubject(subject: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(subject)) return subject
  const base64 = Buffer.from(subject, 'utf-8').toString('base64')
  return `=?UTF-8?B?${base64}?=`
}
