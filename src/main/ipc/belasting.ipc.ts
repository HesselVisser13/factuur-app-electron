// src/main/ipc/belasting.ipc.ts

import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { BelastingInputSchema, InvesteringInputSchema } from '../../shared/schemas'
import { log } from '../logger'
import { belastingService } from '../services/belasting.service'

import { createHandler, validate } from './helpers'

export function registerBelastingHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.BELASTING_BEREKEN,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(BelastingInputSchema, data)
      return belastingService.berekenSchatting(validated)
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.BELASTING_BEREKEN_INVESTERING,
    createHandler(async (_event, data: unknown) => {
      const validated = validate(InvesteringInputSchema, data)
      return belastingService.berekenInvestering(validated)
    })
  )

  log.info('[belasting-ipc] Belasting handlers geregistreerd')
}
