// src/renderer/src/api/cashflow.ts

import type { CashflowOverview, CashflowPeriod } from '@shared/types'

export const cashflowApi = {
  getOverview: (period: CashflowPeriod): Promise<CashflowOverview> =>
    window.api.getCashflowOverview(period)
}
