// src/renderer/src/pages/Dashboard.tsx

import { useEffect, useState } from 'react'
import { formatBedrag } from '../utils/formatters'
import type { BtwAangifte } from '../../../shared/types'

export function Dashboard() {
  const [aangifte, setAangifte] = useState<BtwAangifte | null>(null)
  const kwartaal = Math.ceil((new Date().getMonth() + 1) / 3)
  const jaar = new Date().getFullYear()

  useEffect(() => {
    window.api.getBtwAangifte(kwartaal, jaar).then(setAangifte)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Verschuldigde BTW</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {aangifte ? formatBedrag(aangifte.totaalVerschuldigd) : '...'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Q{kwartaal} {jaar}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Voorbelasting (terug)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {aangifte ? formatBedrag(aangifte.totaalVoorbelasting) : '...'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Q{kwartaal} {jaar}
          </p>
        </div>

        <div
          className={`rounded-xl border-2 p-6 ${
            aangifte && aangifte.afTeDragen >= 0
              ? 'bg-orange-50 border-orange-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <p className="text-sm text-gray-500">Af te dragen</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              aangifte && aangifte.afTeDragen >= 0 ? 'text-orange-700' : 'text-green-700'
            }`}
          >
            {aangifte ? formatBedrag(Math.abs(aangifte.afTeDragen)) : '...'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Q{kwartaal} {jaar}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <p className="text-sm font-medium text-blue-800">
          💡 Tip: Zet elke maand{' '}
          <strong>{aangifte ? formatBedrag(aangifte.afTeDragen / 3) : '...'}</strong> apart op je
          spaarrekening voor de BTW-aangifte.
        </p>
      </div>
    </div>
  )
}
