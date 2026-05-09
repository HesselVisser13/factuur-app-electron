// src/renderer/src/pages/Dashboard.tsx

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { btwAangifteApi, dashboardApi } from '@renderer/api'
import { BtwToggle } from '@renderer/components/BtwToggle'
import { Card } from '@renderer/components/Card'
import { DashboardSkeleton } from '@renderer/components/DashboardSkeleton'
import { ErrorMessage } from '@renderer/components/ErrorMessage'
import { LaatsteFacturenTable } from '@renderer/components/LaatsteFacturenTable'
import { SectionHeader } from '@renderer/components/SectionHeader'
import { useApi } from '@renderer/hooks/useApi'
import { useLocalStorage } from '@renderer/hooks/useLocalStorage'
import { formatCurrency } from '@renderer/utils/formatters'
import { getHuidigKwartaal } from '@renderer/utils/kwartaal'
import { facturenLabel } from '@renderer/utils/pluralize'
import type { BtwAangifte, DashboardStats } from '@shared/types'

const STORAGE_KEYS = {
  toonExcl: 'dashboard_toon_excl'
} as const

export function Dashboard() {
  const navigate = useNavigate()
  const { kwartaal, jaar } = useMemo(() => getHuidigKwartaal(), [])
  const [toonExcl, setToonExcl] = useLocalStorage<boolean>(STORAGE_KEYS.toonExcl, false)

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
  const error = btwError ?? statsError

  const btwTotalen = useMemo(() => {
    if (!btw) return { omzet: 0, inkoop: 0 }
    return btw.regels.reduce(
      (acc, r) => ({
        omzet: acc.omzet + r.omzet,
        inkoop: acc.inkoop + r.inkoop
      }),
      { omzet: 0, inkoop: 0 }
    )
  }, [btw])

  const refetch = (): void => {
    refetchBtw()
    refetchStats()
  }

  const bedrag = (b: { excl: number; incl: number }): number => (toonExcl ? b.excl : b.incl)

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            <span aria-hidden="true">📊</span> Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Overzicht van Q{kwartaal} {jaar}
          </p>
        </div>
        <BtwToggle toonExcl={toonExcl} onChange={setToonExcl} />
      </header>

      {loading && <DashboardSkeleton />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && btw && stats && (
        <>
          <section aria-label="Facturen overzicht">
            <SectionHeader title="Facturen" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                label="Openstaand"
                value={formatCurrency(bedrag(stats.openstaand.bedrag))}
                sub={facturenLabel(stats.openstaand.aantal)}
                tone="info"
                onClick={() => navigate('/facturen')}
              />
              <Card
                label="Vervallen"
                value={formatCurrency(bedrag(stats.vervallen.bedrag))}
                sub={
                  stats.vervallen.aantal === 0
                    ? 'Alles op tijd ✨'
                    : `${facturenLabel(stats.vervallen.aantal)} te laat`
                }
                tone={stats.vervallen.aantal > 0 ? 'danger' : 'success'}
                onClick={() => navigate('/facturen')}
              />
              <Card
                label={`Dit kwartaal (Q${kwartaal})`}
                value={formatCurrency(bedrag(stats.ditKwartaal.bedrag))}
                sub={facturenLabel(stats.ditKwartaal.aantal)}
                tone="neutral"
              />
            </div>
          </section>

          <section aria-label={`BTW-aangifte Q${kwartaal}`}>
            <SectionHeader title={`BTW-aangifte Q${kwartaal}`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                label="Omzet (excl. BTW)"
                value={formatCurrency(btwTotalen.omzet)}
                tone="info"
              />
              <Card
                label="Uitgaven (excl. BTW)"
                value={formatCurrency(btwTotalen.inkoop)}
                tone="neutral"
              />
              <Card
                label="BTW af te dragen"
                value={formatCurrency(btw.afTeDragen)}
                tone={btw.afTeDragen >= 0 ? 'danger' : 'success'}
                onClick={() => navigate('/btw-aangifte')}
              />
            </div>
          </section>

          {stats.laatsteFacturen.length > 0 && (
            <section aria-label="Laatste facturen">
              <SectionHeader
                title="Laatste facturen"
                action={
                  <button
                    type="button"
                    onClick={() => navigate('/facturen')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus-visible:underline"
                  >
                    Alle bekijken →
                  </button>
                }
              />
              <LaatsteFacturenTable facturen={stats.laatsteFacturen} toonExcl={toonExcl} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
