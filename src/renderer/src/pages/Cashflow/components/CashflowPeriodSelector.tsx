// src/renderer/src/pages/Cashflow/components/CashflowPeriodSelector.tsx

import { Calendar } from 'lucide-react'

import { PERIOD_OPTIONS, type PeriodPreset } from '@renderer/utils/cashflow-periods'
import type { CashflowPeriod } from '@shared/types'

interface Props {
  preset: PeriodPreset
  period: CashflowPeriod
  onPresetChange: (preset: PeriodPreset) => void
  onPeriodChange: (period: CashflowPeriod) => void
}

export function CashflowPeriodSelector({ preset, period, onPresetChange, onPeriodChange }: Props) {
  const isCustom = preset === 'custom'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 flex-wrap">
      <Calendar className="w-4 h-4 text-gray-500" aria-hidden="true" />

      <select
        value={preset}
        onChange={(e) => onPresetChange(e.target.value as PeriodPreset)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        aria-label="Periode kiezen"
      >
        {PERIOD_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {isCustom && (
        <>
          <input
            type="date"
            value={period.van}
            onChange={(e) => onPeriodChange({ ...period, van: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            aria-label="Van datum"
          />
          <span className="text-sm text-gray-500">tot</span>
          <input
            type="date"
            value={period.tot}
            onChange={(e) => onPeriodChange({ ...period, tot: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            aria-label="Tot datum"
          />
        </>
      )}
    </div>
  )
}
