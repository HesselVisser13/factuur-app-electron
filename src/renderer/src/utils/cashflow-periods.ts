// src/renderer/src/utils/cashflow-periods.ts

import type { CashflowPeriod } from '@shared/types'

export type PeriodPreset = 'this-year' | 'last-year' | 'last-12-months' | 'custom'

export interface PeriodOption {
  value: PeriodPreset
  label: string
}

export const PERIOD_OPTIONS: ReadonlyArray<PeriodOption> = [
  { value: 'this-year', label: 'Dit jaar' },
  { value: 'last-year', label: 'Vorig jaar' },
  { value: 'last-12-months', label: 'Laatste 12 maanden' },
  { value: 'custom', label: 'Aangepast' }
]

function toIso(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getPeriodFromPreset(preset: PeriodPreset, now: Date = new Date()): CashflowPeriod {
  const year = now.getFullYear()

  switch (preset) {
    case 'this-year':
      return {
        van: toIso(new Date(year, 0, 1)),
        tot: toIso(new Date(year, 11, 31))
      }

    case 'last-year':
      return {
        van: toIso(new Date(year - 1, 0, 1)),
        tot: toIso(new Date(year - 1, 11, 31))
      }

    case 'last-12-months': {
      const start = new Date(now)
      start.setMonth(start.getMonth() - 11)
      start.setDate(1)
      return {
        van: toIso(start),
        tot: toIso(now)
      }
    }

    case 'custom':
    default:
      return {
        van: toIso(new Date(year, 0, 1)),
        tot: toIso(now)
      }
  }
}
