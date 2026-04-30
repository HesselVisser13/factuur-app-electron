// src/renderer/src/pages/BtwAangifte.tsx

import { useEffect, useState } from 'react'
import { formatBedrag } from '../utils/formatters'
import type { BtwAangifte as BtwAangifteType } from '../../../shared/types'

export function BtwAangifte() {
  const [aangifte, setAangifte] = useState<BtwAangifteType | null>(null)
  const [kwartaal, setKwartaal] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [jaar, setJaar] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.getBtwAangifte(kwartaal, jaar).then((data) => {
      setAangifte(data)
      setLoading(false)
    })
  }, [kwartaal, jaar])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🏛️ BTW-aangifte</h1>

      {/* Periode kiezer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Kwartaal</label>
            <select
              value={kwartaal}
              onChange={(e) => setKwartaal(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
            >
              <option value={1}>Q1 (jan - mrt)</option>
              <option value={2}>Q2 (apr - jun)</option>
              <option value={3}>Q3 (jul - sep)</option>
              <option value={4}>Q4 (okt - dec)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Jaar</label>
            <select
              value={jaar}
              onChange={(e) => setJaar(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
            >
              {[2024, 2025, 2026].map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Laden...</div>
      ) : aangifte ? (
        <>
          {/* Verschuldigde BTW */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Verschuldigde BTW (over verkoop)
            </h2>
            {aangifte.regels.filter((r) => r.omzet > 0).length === 0 ? (
              <p className="text-gray-400 text-sm">Geen verkopen in deze periode</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Tarief</th>
                    <th className="pb-2 text-right">Omzet (excl.)</th>
                    <th className="pb-2 text-right">BTW</th>
                  </tr>
                </thead>
                <tbody>
                  {aangifte.regels
                    .filter((r) => r.omzet > 0)
                    .map((regel) => (
                      <tr key={regel.percentage} className="border-b border-gray-100">
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              regel.percentage === 21
                                ? 'bg-orange-100 text-orange-700'
                                : regel.percentage === 9
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {regel.percentage}%
                          </span>
                        </td>
                        <td className="py-3 text-right">{formatBedrag(regel.omzet)}</td>
                        <td className="py-3 text-right font-medium">
                          {formatBedrag(regel.verschuldigdeBtw)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Voorbelasting */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Voorbelasting (BTW op inkoop)
            </h2>
            {aangifte.regels.filter((r) => r.inkoop > 0).length === 0 ? (
              <p className="text-gray-400 text-sm">Geen uitgaven in deze periode</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Tarief</th>
                    <th className="pb-2 text-right">Inkoop (excl.)</th>
                    <th className="pb-2 text-right">BTW terug</th>
                  </tr>
                </thead>
                <tbody>
                  {aangifte.regels
                    .filter((r) => r.inkoop > 0)
                    .map((regel) => (
                      <tr key={regel.percentage} className="border-b border-gray-100">
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              regel.percentage === 21
                                ? 'bg-orange-100 text-orange-700'
                                : regel.percentage === 9
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {regel.percentage}%
                          </span>
                        </td>
                        <td className="py-3 text-right">{formatBedrag(regel.inkoop)}</td>
                        <td className="py-3 text-right font-medium text-green-600">
                          - {formatBedrag(regel.voorbelasting)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Eindresultaat */}
          <div
            className={`rounded-xl border-2 p-6 ${
              aangifte.afTeDragen >= 0
                ? 'bg-orange-50 border-orange-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Resultaat
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Verschuldigde BTW</span>
                <span>{formatBedrag(aangifte.totaalVerschuldigd)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Voorbelasting (aftrek)</span>
                <span>- {formatBedrag(aangifte.totaalVoorbelasting)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between text-xl font-bold">
                <span>{aangifte.afTeDragen >= 0 ? 'Af te dragen' : 'Terug te ontvangen'}</span>
                <span className={aangifte.afTeDragen >= 0 ? 'text-orange-700' : 'text-green-700'}>
                  {formatBedrag(Math.abs(aangifte.afTeDragen))}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              💡 Dit bedrag vul je in bij je BTW-aangifte over Q{kwartaal} {jaar}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
