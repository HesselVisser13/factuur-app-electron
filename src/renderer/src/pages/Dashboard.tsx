// src/renderer/src/pages/Dashboard.tsx

import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatCurrency, formatDate } from '../utils/formatters'
import { btwAangifteApi, dashboardApi } from '../api'
import { klantDisplayNaam } from '../../../shared/klant-utils'
import type { BtwAangifte, DashboardStats } from '../../../shared/types'

export function Dashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const kwartaal = Math.floor(now.getMonth() / 3) + 1
  const jaar = now.getFullYear()

  const {
    data: btw,
    loading: btwLoading,
    error: btwError,
    refetch: refetchBtw
  } = useApi<BtwAangifte>(() => btwAangifteApi.genereer(kwartaal, jaar), [kwartaal, jaar])

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useApi<DashboardStats>(() => dashboardApi.getStats(), [])

  const loading = btwLoading || statsLoading
  const error = btwError || statsError

  function refetch() {
    refetchBtw()
    refetchStats()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">📊 Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Overzicht van Q{kwartaal} {jaar}
        </p>
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Laden...</div>}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && btw && stats && (
        <>
          {/* Facturen-sectie */}
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
              Facturen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                label="Openstaand"
                value={formatCurrency(stats.openstaand.bedrag)}
                sub={`${stats.openstaand.aantal} factu${stats.openstaand.aantal === 1 ? 'ur' : 'ren'}`}
                color="blue"
                onClick={() => navigate('/facturen')}
              />
              <Card
                label="Vervallen"
                value={formatCurrency(stats.vervallen.bedrag)}
                sub={
                  stats.vervallen.aantal === 0
                    ? 'Alles op tijd ✨'
                    : `${stats.vervallen.aantal} factu${stats.vervallen.aantal === 1 ? 'ur' : 'ren'} te laat`
                }
                color={stats.vervallen.aantal > 0 ? 'red' : 'green'}
                onClick={() => navigate('/facturen')}
              />
              <Card
                label={`Dit kwartaal (Q${kwartaal})`}
                value={formatCurrency(stats.ditKwartaal.bedrag)}
                sub={`${stats.ditKwartaal.aantal} factu${stats.ditKwartaal.aantal === 1 ? 'ur' : 'ren'}`}
                color="gray"
              />
            </div>
          </section>

          {/* BTW-sectie */}
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
              BTW-aangifte Q{kwartaal}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                label="Omzet (excl. BTW)"
                value={formatCurrency(btw.regels.reduce((sum, r) => sum + r.omzet, 0))}
                color="blue"
              />
              <Card
                label="Uitgaven (excl. BTW)"
                value={formatCurrency(btw.regels.reduce((sum, r) => sum + r.inkoop, 0))}
                color="gray"
              />
              <Card
                label="BTW af te dragen"
                value={formatCurrency(btw.afTeDragen)}
                color={btw.afTeDragen >= 0 ? 'red' : 'green'}
                onClick={() => navigate('/btw-aangifte')}
              />
            </div>
          </section>

          {/* Laatste facturen */}
          {stats.laatsteFacturen.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Laatste facturen
                </h2>
                <button
                  onClick={() => navigate('/facturen')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Alle bekijken →
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">Nummer</th>
                      <th className="text-left px-4 py-3">Datum</th>
                      <th className="text-left px-4 py-3">Klant</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.laatsteFacturen.map((f) => {
                      const vervallen =
                        f.status === 'verstuurd' && new Date(f.vervalDatum) < new Date()
                      return (
                        <tr
                          key={f.id}
                          onClick={() => navigate(`/facturen/${f.id}`)}
                          className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-4 py-3 font-medium font-mono">{f.factuurNummer}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(f.datum)}</td>
                          <td className="px-4 py-3">{klantDisplayNaam(f.klant)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={f.status} vervallen={vervallen} />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(f.totaalIncl)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================
// Card component (uitgebreid)
// ============================================================

type CardColor = 'blue' | 'gray' | 'red' | 'green'

function Card({
  label,
  value,
  sub,
  color,
  onClick
}: {
  label: string
  value: string
  sub?: string
  color: CardColor
  onClick?: () => void
}) {
  const colorClasses: Record<CardColor, string> = {
    blue: 'border-blue-200 bg-blue-50',
    gray: 'border-gray-200 bg-gray-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50'
  }

  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-6 ${colorClasses[color]} ${clickableClasses}`}
    >
      <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-2">{sub}</div>}
    </div>
  )
}

// ============================================================
// Status badge
// ============================================================

function StatusBadge({ status, vervallen }: { status: string; vervallen: boolean }) {
  const config: Record<string, { label: string; classes: string; icon: string }> = {
    concept: { label: 'Concept', classes: 'bg-gray-100 text-gray-700', icon: '📝' },
    verstuurd: { label: 'Verstuurd', classes: 'bg-blue-100 text-blue-700', icon: '📤' },
    betaald: { label: 'Betaald', classes: 'bg-green-100 text-green-700', icon: '✅' },
    geannuleerd: { label: 'Geannuleerd', classes: 'bg-red-100 text-red-700', icon: '🚫' }
  }

  const c = config[status]

  return (
    <>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.classes}`}>
        {c.icon} {c.label}
      </span>
      {vervallen && (
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
          ⚠️ Vervallen
        </span>
      )}
    </>
  )
}
