// src/main/ipc/transacties.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { transactieService } from '../services/transactie.service'
import { TransactieInputSchema, TransactieUpdateSchema, PeriodeSchema } from '../../shared/schemas'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { z } from 'zod'

export function registerTransactieHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIES_GET_BY_PERIODE,
    createHandler(async (_event, van: string, tot: string) => {
      const periode = validate(PeriodeSchema, { van, tot })
      return transactieService.getByPeriode(periode.van, periode.tot)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIES_CREATE,
    createHandler(async (_event, input: unknown) => {
      const validated = validate(TransactieInputSchema, input)
      return transactieService.create(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIES_DELETE,
    createHandler(async (_event, id: unknown) => {
      const validId = validate(z.number().int().positive(), id)
      return transactieService.delete(validId)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.TRANSACTIES_UPDATE,
    createHandler(async (_event, input: unknown) => {
      const validated = validate(TransactieUpdateSchema, input)
      return transactieService.update(validated)
    })
  )
}
