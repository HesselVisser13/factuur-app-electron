// src/renderer/src/pages/Dashboard.tsx

import { useApi } from '../hooks/useApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatBedrag } from '../utils/formatters'
import type { BtwAangifte } from '../../../shared/types'

export function Dashboard() {
  const now = new Date()
  const kwartaal = Math.floor(now.getMonth() / 3) + 1
  const jaar = now.getFullYear()

  const { data, loading, error, refetch } = useApi<BtwAangifte>(
    () => window.api.getBtwAangifte(kwartaal, jaar),
    [kwartaal, jaar]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>
      <p className="text-gray-600 text-sm">
        Overzicht van dit kwartaal (Q{kwartaal} {jaar})
      </p>

      {loading && <div className="text-center py-12 text-gray-500">Laden...</div>}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            label="Omzet (excl. BTW)"
            value={formatBedrag(data.regels.reduce((sum, r) => sum + r.omzet, 0))}
            color="blue"
          />
          <Card
            label="Uitgaven (excl. BTW)"
            value={formatBedrag(data.regels.reduce((sum, r) => sum + r.inkoop, 0))}
            color="gray"
          />
          <Card
            label="BTW af te dragen"
            value={formatBedrag(data.afTeDragen)}
            color={data.afTeDragen >= 0 ? 'red' : 'green'}
          />
        </div>
      )}
    </div>
  )
}

function Card({
  label,
  value,
  color
}: {
  label: string
  value: string
  color: 'blue' | 'gray' | 'red' | 'green'
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    gray: 'border-gray-200 bg-gray-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50'
  }

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
