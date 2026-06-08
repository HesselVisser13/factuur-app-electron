// src/main/ipc/mail.ipc.ts

import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { MailAuthStatus, MailLogEntry, MailResult } from '@shared/mail-types'

import { log } from '../logger'
import { facturenService } from '../services/facturen.service'
import { mailLogService } from '../services/mail-log.service'
import { getMailService } from '../services/mail'
import { pdfService } from '../services/pdf.service'
import { getReadableMailError } from '../services/mail/error-mapper'
import { offertePdfService } from '../services/offerte-pdf.service'
import { offertesService } from '../services/offertes.service'

interface SendMailRequest {
  factuurId: number
  ontvanger: string
  onderwerp: string
  body: string
}

interface SendOfferteMailRequest {
  offerteId: number
  ontvanger: string
  onderwerp: string
  body: string
}

/** Wrap result in success-envelope dat preload verwacht. */
type Envelope<T> = { success: true; data: T } | { success: false; error: string }

function ok<T>(data: T): Envelope<T> {
  return { success: true, data }
}

function fail(error: unknown): Envelope<never> {
  return { success: false, error: getReadableMailError(error) }
}

export function registerMailIpc(): void {
  // ============================================================
  // Auth-status ophalen
  // ============================================================
  ipcMain.handle(IPC_CHANNELS.MAIL_GET_AUTH_STATUS, async (): Promise<Envelope<MailAuthStatus>> => {
    try {
      const service = getMailService()
      return ok({
        configured: service.isConfigured(),
        authenticated: service.isAuthenticated(),
        email: service.getAuthenticatedEmail() ?? undefined
      })
    } catch (err) {
      log.error('[mail-ipc] getAuthStatus mislukt', err)
      return fail(err)
    }
  })

  // ============================================================
  // Authenticeren (OAuth flow)
  // ============================================================
  ipcMain.handle(IPC_CHANNELS.MAIL_AUTHENTICATE, async (): Promise<Envelope<MailAuthStatus>> => {
    try {
      const service = getMailService()
      const result = await service.authenticate()
      log.info(`[mail-ipc] Geauthenticeerd als ${result.email}`)
      return ok({
        configured: true,
        authenticated: true,
        email: result.email
      })
    } catch (err) {
      log.error('[mail-ipc] authenticate mislukt', err)
      return fail(err)
    }
  })

  // ============================================================
  // Verbinding verbreken
  // ============================================================
  ipcMain.handle(IPC_CHANNELS.MAIL_DISCONNECT, async (): Promise<Envelope<void>> => {
    try {
      const service = getMailService()
      service.disconnect()
      log.info('[mail-ipc] Verbinding verbroken')
      return ok(undefined)
    } catch (err) {
      log.error('[mail-ipc] disconnect mislukt', err)
      return fail(err)
    }
  })

  // ============================================================
  // Mail versturen (met factuur PDF als bijlage)
  // ============================================================
  ipcMain.handle(
    IPC_CHANNELS.MAIL_SEND,
    async (_event, request: SendMailRequest): Promise<Envelope<MailResult>> => {
      try {
        const service = getMailService()

        if (!service.isAuthenticated()) {
          return ok({
            success: false,
            error: 'Niet verbonden met Gmail. Configureer eerst je mail-account in Instellingen.'
          })
        }

        // 1. Factuur ophalen voor context
        const factuur = await facturenService.getById(request.factuurId)
        if (!factuur) {
          return ok({ success: false, error: 'Factuur niet gevonden' })
        }

        // 2. PDF genereren (in-memory buffer)
        let pdfBuffer: Buffer
        try {
          pdfBuffer = await pdfService.genereerFactuurPdfBuffer(request.factuurId, {
            forceFinal: true
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'PDF genereren mislukt'
          log.error('[mail-ipc] PDF genereren mislukt', err)
          await mailLogService.create({
            factuurId: request.factuurId,
            ontvanger: request.ontvanger,
            onderwerp: request.onderwerp,
            body: request.body,
            status: 'failed',
            errorMsg
          })
          return ok({
            success: false,
            error: 'PDF genereren mislukt — controleer de factuurgegevens en probeer opnieuw.'
          })
        }

        // 3. Mail versturen
        const sendResult = await service.send({
          to: request.ontvanger,
          subject: request.onderwerp,
          body: request.body,
          attachments: [
            {
              filename: `${factuur.factuurNummer}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        })

        // 4. Log opslaan (succes of falen)
        await mailLogService.create({
          factuurId: request.factuurId,
          ontvanger: request.ontvanger,
          onderwerp: request.onderwerp,
          body: request.body,
          status: sendResult.success ? 'sent' : 'failed',
          errorMsg: sendResult.error ?? null,
          messageId: sendResult.messageId ?? null
        })

        // 5. Bij succes: status concept → verstuurd automatisch
        if (sendResult.success && factuur.status === 'concept') {
          try {
            await facturenService.updateStatus(request.factuurId, 'verstuurd')
            log.info(
              `[mail-ipc] Status automatisch op verstuurd gezet voor factuur ${factuur.factuurNummer}`
            )
          } catch (err) {
            log.warn('[mail-ipc] Auto-status update mislukt (mail wel verzonden)', err)
          }
        }

        return ok(sendResult)
      } catch (err) {
        log.error('[mail-ipc] send mislukt', err)
        return fail(err)
      }
    }
  )

  // ============================================================
  // Mail-log per factuur ophalen
  // ============================================================
  ipcMain.handle(
    IPC_CHANNELS.MAIL_GET_LOG,
    async (_event, factuurId: number): Promise<Envelope<MailLogEntry[]>> => {
      try {
        const logs = await mailLogService.listByFactuur(factuurId)
        return ok(logs)
      } catch (err) {
        log.error('[mail-ipc] getLog mislukt', err)
        return fail(err)
      }
    }
  )

  // ============================================================
  // Offerte mail versturen
  // ============================================================
  ipcMain.handle(
    IPC_CHANNELS.MAIL_SEND_OFFERTE,
    async (_event, request: SendOfferteMailRequest): Promise<Envelope<MailResult>> => {
      try {
        const service = getMailService()

        if (!service.isAuthenticated()) {
          return ok({
            success: false,
            error: 'Niet verbonden met Gmail. Configureer eerst je mail-account in Instellingen.'
          })
        }

        const offerte = await offertesService.getById(request.offerteId)
        if (!offerte) {
          return ok({ success: false, error: 'Offerte niet gevonden' })
        }

        let pdfBuffer: Buffer
        try {
          pdfBuffer = await offertePdfService.genereerOffertePdfBuffer(request.offerteId, {
            forceFinal: true
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'PDF genereren mislukt'
          log.error('[mail-ipc] Offerte-PDF genereren mislukt', err)
          await mailLogService.create({
            offerteId: request.offerteId,
            ontvanger: request.ontvanger,
            onderwerp: request.onderwerp,
            body: request.body,
            status: 'failed',
            errorMsg
          })
          return ok({
            success: false,
            error: 'PDF genereren mislukt — controleer de offertegegevens en probeer opnieuw.'
          })
        }

        const sendResult = await service.send({
          to: request.ontvanger,
          subject: request.onderwerp,
          body: request.body,
          attachments: [
            {
              filename: `${offerte.offerteNummer}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        })

        await mailLogService.create({
          offerteId: request.offerteId,
          ontvanger: request.ontvanger,
          onderwerp: request.onderwerp,
          body: request.body,
          status: sendResult.success ? 'sent' : 'failed',
          errorMsg: sendResult.error ?? null,
          messageId: sendResult.messageId ?? null
        })

        // Auto-status: concept → verzonden
        if (sendResult.success && offerte.status === 'concept') {
          try {
            await offertesService.updateStatus(request.offerteId, 'verzonden')
            log.info(
              `[mail-ipc] Status automatisch op verzonden gezet voor offerte ${offerte.offerteNummer}`
            )
          } catch (err) {
            log.warn('[mail-ipc] Auto-status update mislukt (mail wel verzonden)', err)
          }
        }

        return ok(sendResult)
      } catch (err) {
        log.error('[mail-ipc] sendOfferte mislukt', err)
        return fail(err)
      }
    }
  )

  // ============================================================
  // Offerte mail-log ophalen
  // ============================================================
  ipcMain.handle(
    IPC_CHANNELS.MAIL_GET_LOG_OFFERTE,
    async (_event, offerteId: number): Promise<Envelope<MailLogEntry[]>> => {
      try {
        const logs = await mailLogService.listByOfferte(offerteId)
        return ok(logs)
      } catch (err) {
        log.error('[mail-ipc] getLogOfferte mislukt', err)
        return fail(err)
      }
    }
  )

  log.info('[mail-ipc] Mail IPC handlers geregistreerd')
}
