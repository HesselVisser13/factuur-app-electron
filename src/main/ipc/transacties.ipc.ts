// src/main/ipc/transacties.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { transactieService } from '../services/transactie.service'
import { TransactieInputSchema, PeriodeSchema } from '../../shared/schemas'
import { z } from 'zod'

export function registerTransactieHandlers() {
  ipcMain.handle(
    'transacties:getByPeriode',
    createHandler(async (_event, van: string, tot: string) => {
      const periode = validate(PeriodeSchema, { van, tot })
      return transactieService.getByPeriode(periode.van, periode.tot)
    })
  )

  ipcMain.handle(
    'transacties:create',
    createHandler(async (_event, input: unknown) => {
      const validated = validate(TransactieInputSchema, input)
      return transactieService.create(validated)
    })
  )

  ipcMain.handle(
    'transacties:delete',
    createHandler(async (_event, id: unknown) => {
      const validId = validate(z.number().int().positive(), id)
      return transactieService.delete(validId)
    })
  )
}
