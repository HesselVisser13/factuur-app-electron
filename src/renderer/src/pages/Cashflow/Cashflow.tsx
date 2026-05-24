// src/renderer/src/pages/Cashflow/Cashflow.tsx

import { TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { cashflowApi } from '@renderer/api'
import { useToast } from '@renderer/components/Toast'
import { getPeriodFromPreset, type PeriodPreset } from '@renderer/utils/cashflow-periods'
import type { CashflowOverview, CashflowPeriod } from '@shared/types'

import { CashflowKpiCards } from './components/CashflowKpiCards'
import { CashflowMaandChart } from './components/CashflowMaandChart'
import { CashflowPeriodSelector } from './components/CashflowPeriodSelector'
import { CashflowSaldoChart } from './components/CashflowSaldoChart'
import { CashflowTopKlanten } from './components/CashflowTopKlanten'
import { CashflowUitgavenChart } from './components/CashflowUitgavenChart'

export function Cashflow() {
  const toast = useToast()

  const [preset, setPreset] = useState<PeriodPreset>('this-year')
  const [period, setPeriod] = useState<CashflowPeriod>(() => getPeriodFromPreset('this-year'))
  const [data, setData] = useState<CashflowOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(
    async (p: CashflowPeriod): Promise<void> => {
      setLoading(true)
      try {
        const overview = await cashflowApi.getOverview(p)
        setData(overview)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Cashflow laden mislukt')
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    void loadData(period)
  }, [period, loadData])

  const handlePresetChange = (newPreset: PeriodPreset): void => {
    setPreset(newPreset)
    if (newPreset !== 'custom') {
      setPeriod(getPeriodFromPreset(newPreset))
    }
  }

  const handleCustomPeriodChange = (newPeriod: CashflowPeriod): void => {
    setPeriod(newPeriod)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Cashflow
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Inzicht in je inkomsten, uitgaven en financiële positie.
          </p>
        </div>

        <CashflowPeriodSelector
          preset={preset}
          period={period}
          onPresetChange={handlePresetChange}
          onPeriodChange={handleCustomPeriodChange}
        />
      </div>

      {loading && !data ? (
        <div className="text-center text-gray-500 py-12">Cashflow laden...</div>
      ) : !data ? (
        <div className="text-center text-gray-500 py-12">Geen data beschikbaar</div>
      ) : (
        <>
          <CashflowKpiCards kpis={data.kpis} />
          <CashflowSaldoChart data={data.perMaand} />
          <CashflowMaandChart data={data.perMaand} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashflowUitgavenChart data={data.uitgavenPerCategorie} />
            <CashflowTopKlanten data={data.topKlanten} />
          </div>
        </>
      )}
    </div>
  )
}
