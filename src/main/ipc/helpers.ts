// src/main/ipc/helpers.ts

import type { IpcResult } from '../../shared/types'
import { ZodSchema } from 'zod'
import { log } from '../logger'

export function createHandler<T>(handler: (...args: any[]) => Promise<T>) {
  return async (...args: any[]): Promise<IpcResult<T>> => {
    try {
      const data = await handler(...args)
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout'
      log.error('[IPC Error]', message, error)
      return { success: false, error: message }
    }
  }
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((e) => e.message).join(', ')
    throw new Error(`Validatiefout: ${errors}`)
  }
  return result.data
}
