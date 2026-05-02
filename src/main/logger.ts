// src/main/logger.ts

import log from 'electron-log/main'
import { app } from 'electron'
import path from 'path'

export function initLogger() {
  // Logs worden opgeslagen in:
  // Windows: %USERPROFILE%\AppData\Roaming\factuur-app-electron\logs\
  log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log')

  log.transports.file.level = 'info'
  log.transports.console.level = 'debug'

  // Global error handlers
  process.on('uncaughtException', (error) => {
    log.error('[Uncaught Exception]', error)
  })

  process.on('unhandledRejection', (reason) => {
    log.error('[Unhandled Rejection]', reason)
  })

  log.info('App started')
}

export { log }
