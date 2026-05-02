// src/renderer/src/pages/BtwAangifte.tsx

import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatBedrag } from '../utils/formatters'
import type { BtwAangifte as BtwAangifteType } from '../../../shared/types'

export function BtwAangifte() {
  const [kwartaal, setKwartaal] = useState(1)
  const [jaar, setJaar] = useState(new Date().getFullYear())

  const { data, loading, error, refetch } = useApi<BtwAangifteType>(
    () => window.api.getBtwAangifte(kwartaal, jaar),
    [kwartaal, jaar]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🏛️ BTW-aangifte</h1>

      {/* Periode selectie */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Kwartaal</label>
          <select
            value={kwartaal}
            onChange={(e) => setKwartaal(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>Q1 (jan-mrt)</option>
            <option value={2}>Q2 (apr-jun)</option>
            <option value={3}>Q3 (jul-sep)</option>
            <option value={4}>Q4 (okt-dec)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Jaar</label>
          <input
            type="number"
            value={jaar}
            onChange={(e) => setJaar(Number(e.target.value))}
            min="2020"
            max="2100"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
          />
        </div>
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Laden...</div>}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                    Tarief
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                    Omzet
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                    Verschuldigd
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                    Inkoop
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                    Voorbelasting
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.regels.map((r) => (
                  <tr key={r.percentage} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium">{r.tariefNaam}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatBedrag(r.omzet)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatBedrag(r.verschuldigdeBtw)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{formatBedrag(r.inkoop)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatBedrag(r.voorbelasting)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaal */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                  Verschuldigd
                </div>
                <div className="text-xl font-bold">{formatBedrag(data.totaalVerschuldigd)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                  Voorbelasting
                </div>
                <div className="text-xl font-bold">{formatBedrag(data.totaalVoorbelasting)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                  Af te dragen
                </div>
                <div
                  className={`text-xl font-bold ${data.afTeDragen >= 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatBedrag(data.afTeDragen)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
