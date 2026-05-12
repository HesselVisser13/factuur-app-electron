// src/main/services/mail-log.service.ts

import { getDatabase } from '../db/client'

import type { MailLogEntry } from '@shared/mail-types'

interface CreateMailLogInput {
  factuurId: number
  ontvanger: string
  onderwerp: string
  body: string
  status: 'sent' | 'failed'
  errorMsg?: string | null
  messageId?: string | null
}

export const mailLogService = {
  async create(input: CreateMailLogInput): Promise<MailLogEntry> {
    const prisma = getDatabase()
    const log = await prisma.mailLog.create({
      data: {
        factuurId: input.factuurId,
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
  }
}

type MailLogRow = Awaited<ReturnType<ReturnType<typeof getDatabase>['mailLog']['create']>>

function mapToEntry(row: MailLogRow): MailLogEntry {
  return {
    id: row.id,
    factuurId: row.factuurId,
    verzondenOp: row.verzondenOp.toISOString(),
    ontvanger: row.ontvanger,
    onderwerp: row.onderwerp,
    body: row.body,
    status: row.status as 'sent' | 'failed',
    errorMsg: row.errorMsg,
    messageId: row.messageId
  }
}
