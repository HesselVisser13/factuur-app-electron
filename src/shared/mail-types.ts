// src/shared/mail-types.ts

/**
 * Mail-gerelateerde types die zowel main als renderer gebruiken.
 */

export interface MailAttachment {
  filename: string
  content: Buffer | Uint8Array
  contentType: string
}

export interface MailMessage {
  to: string
  subject: string
  body: string
  attachments?: MailAttachment[]
}

export interface MailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface MailAuthStatus {
  configured: boolean // OAuth credentials in env aanwezig
  authenticated: boolean // gebruiker heeft ingelogd
  email?: string // het ingelogde Gmail-adres
}

export interface MailLogEntry {
  id: number
  factuurId: number
  verzondenOp: string // ISO datetime
  ontvanger: string
  onderwerp: string
  body: string
  status: 'sent' | 'failed'
  errorMsg?: string | null
  messageId?: string | null
}
