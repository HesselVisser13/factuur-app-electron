// src/renderer/src/pages/Cashflow/components/CashflowTopKlanten.tsx

import { Trophy } from 'lucide-react'

import { formatCents, type Cents } from '@renderer/utils/money'
import type { KlantOmzetData } from '@shared/types'

interface Props {
  data: KlantOmzetData[]
}

export function CashflowTopKlanten({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4" aria-hidden="true" />
          Top klanten
        </h2>
        <div className="text-center text-gray-500 py-12 text-sm">Geen omzet in deze periode</div>
      </div>
    )
  }

  // Vind het hoogste bedrag voor de progress-bars
  const maxBedrag = Math.max(...data.map((k) => k.bedrag))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-2">
        <Trophy className="w-4 h-4" aria-hidden="true" />
        Top klanten
      </h2>
      <p className="text-xs text-gray-500 mb-4">Op basis van gefactureerde omzet.</p>

      <div className="space-y-3">
        {data.map((klant, index) => {
          const isOverige = klant.klantId === -1
          const barWidth = (klant.bedrag / maxBedrag) * 100

          return (
            <div key={`${klant.klantId}-${index}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {!isOverige && (
                    <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                      {index + 1}.
                    </span>
                  )}
                  <span
                    className={`text-sm truncate ${
                      isOverige ? 'text-gray-500 italic' : 'text-gray-900 font-medium'
                    }`}
                  >
                    {klant.klantNaam}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-500 tabular-nums">
                    {klant.percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-gray-900 tabular-nums">
                    {formatCents(klant.bedrag as Cents)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isOverige ? 'bg-gray-400' : 'bg-blue-500'} transition-all`}
                  style={{ width: `${barWidth}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
