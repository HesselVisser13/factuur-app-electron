// src/main/services/mail/index.ts

import { getConfig } from '../../config'
import { GmailMailService } from './gmail-mail.service'

let instance: GmailMailService | null = null

/**
 * Singleton factory voor de mail service.
 * In de toekomst kan dit andere providers ondersteunen (SMTP, SendGrid, etc.)
 */
export function getMailService(): GmailMailService {
  if (!instance) {
    const config = getConfig()
    instance = new GmailMailService({
      clientId: config.gmail.clientId,
      clientSecret: config.gmail.clientSecret
    })
  }
  return instance
}

export { GmailMailService }
