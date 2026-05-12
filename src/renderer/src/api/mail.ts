// src/renderer/src/api/mail.ts

import type { MailAuthStatus, MailLogEntry, MailResult } from '@shared/mail-types'

export interface SendMailRequest {
  factuurId: number
  ontvanger: string
  onderwerp: string
  body: string
}

export const mailApi = {
  getAuthStatus: (): Promise<MailAuthStatus> => window.api.getMailAuthStatus(),
  authenticate: (): Promise<MailAuthStatus> => window.api.authenticateMail(),
  disconnect: (): Promise<void> => window.api.disconnectMail(),
  send: (request: SendMailRequest): Promise<MailResult> => window.api.sendMail(request),
  getLog: (factuurId: number): Promise<MailLogEntry[]> => window.api.getMailLog(factuurId)
}
