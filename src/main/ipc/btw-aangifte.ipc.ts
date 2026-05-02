// src/main/ipc/btw-aangifte.ipc.ts

import { ipcMain } from 'electron'
import { createHandler, validate } from './helpers'
import { btwAangifteService } from '../services/btw-aangifte.service'
import { KwartaalSchema } from '../../shared/schemas'

export function registerBtwAangifteHandlers() {
  ipcMain.handle(
    'btwAangifte:genereer',
    createHandler(async (_event, kwartaal: number, jaar: number) => {
      const validated = validate(KwartaalSchema, { kwartaal, jaar })
      return btwAangifteService.genereer(validated.kwartaal, validated.jaar)
    })
  )
}
