// src/main/services/mail-log.service.ts

import type { MailLogEntry } from '@shared/mail-types'

import { getDatabase } from '../db/client'

interface CreateMailLogInput {
  /** Exact één van factuurId / offerteId vereist */
  factuurId?: number
  offerteId?: number
  ontvanger: string
  onderwerp: string
  body: string
  status: 'sent' | 'failed'
  errorMsg?: string | null
  messageId?: string | null
}

export const mailLogService = {
  async create(input: CreateMailLogInput): Promise<MailLogEntry> {
    if (!input.factuurId && !input.offerteId) {
      throw new Error('factuurId of offerteId is vereist')
    }
    if (input.factuurId && input.offerteId) {
      throw new Error('Slechts één van factuurId/offerteId mag gezet zijn')
    }

    const prisma = getDatabase()
    const log = await prisma.mailLog.create({
      data: {
        factuurId: input.factuurId ?? null,
        offerteId: input.offerteId ?? null,
        ontvanger: input.ontvanger,
        onderwerp: input.onderwerp,
        body: input.body,
        status: input.status,
        errorMsg: input.errorMsg ?? null,
        messageId: input.messageId ?? null
      }
    })
    return mapToEntry(log)
  },

  async listByFactuur(factuurId: number): Promise<MailLogEntry[]> {
    const prisma = getDatabase()
    const logs = await prisma.mailLog.findMany({
      where: { factuurId },
      orderBy: { verzondenOp: 'desc' }
    })
    return logs.map(mapToEntry)
  },

  async listByOfferte(offerteId: number): Promise<MailLogEntry[]> {
    const prisma = getDatabase()
    const logs = await prisma.mailLog.findMany({
      where: { offerteId },
      orderBy: { verzondenOp: 'desc' }
    })
    return logs.map(mapToEntry)
  }
}

type MailLogRow = Awaited<ReturnType<ReturnType<typeof getDatabase>['mailLog']['create']>>

function mapToEntry(row: MailLogRow): MailLogEntry {
  return {
    id: row.id,
    factuurId: row.factuurId,
    offerteId: row.offerteId,
    verzondenOp: row.verzondenOp.toISOString(),
    ontvanger: row.ontvanger,
    onderwerp: row.onderwerp,
    body: row.body,
    status: row.status as 'sent' | 'failed',
    errorMsg: row.errorMsg,
    messageId: row.messageId
  }
}
