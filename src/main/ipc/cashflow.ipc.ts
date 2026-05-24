// src/main/ipc/cashflow.ipc.ts

import { ipcMain } from 'electron'
import { z } from 'zod'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { log } from '../logger'
import { cashflowService } from '../services/cashflow.service'

import { createHandler, validate } from './helpers'

const PeriodSchema = z.object({
  van: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum (YYYY-MM-DD)'),
  tot: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldige datum (YYYY-MM-DD)')
})

export function registerCashflowHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CASHFLOW_GET_OVERVIEW,
    createHandler(async (_event, data: unknown) => {
      const period = validate(PeriodSchema, data)
      return cashflowService.getOverview(period)
    })
  )

  log.info('[cashflow-ipc] Cashflow handlers geregistreerd')
}
