// src/main/ipc/belasting.ipc.ts

import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { BelastingInputSchema } from '../../shared/schemas'
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

  log.info('[belasting-ipc] Belasting handlers geregistreerd')
}
