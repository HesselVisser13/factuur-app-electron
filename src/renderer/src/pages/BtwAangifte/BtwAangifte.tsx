//src/renderer/src/pages/BtwAangifte/BtwAangifte.tsx

import { ErrorMessage } from '@renderer/components/ErrorMessage'
import { useApi } from '@renderer/hooks/useApi'
import { useLocalStorage } from '@renderer/hooks/useLocalStorage'
import { btwAangifteApi } from '@renderer/api'
import { getHuidigKwartaal } from '@renderer/utils/kwartaal'
import type { BtwAangifte as BtwAangifteType } from '@shared/types'

import { BtwAangifteTabel } from './components/BtwAangifteTabel'
import { BtwAangifteTotalen } from './components/BtwAangifteTotalen'
import { BtwAangiftePeriode } from './components/BtwAangiftePeriode'
import { Calculator } from 'lucide-react'

const STORAGE_KEYS = {
  kwartaal: 'btw_aangifte_kwartaal',
  jaar: 'btw_aangifte_jaar'
} as const

const huidig = getHuidigKwartaal()

export function BtwAangifte() {
  const [kwartaal, setKwartaal] = useLocalStorage<number>(STORAGE_KEYS.kwartaal, huidig.kwartaal)
  const [jaar, setJaar] = useLocalStorage<number>(STORAGE_KEYS.jaar, huidig.jaar)

  const { data, loading, error, refetch } = useApi<BtwAangifteType>(
    () => btwAangifteApi.genereer(kwartaal, jaar),
    [kwartaal, jaar]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Calculator className="w-7 h-7 text-blue-600" aria-hidden="true" />
        BTW-aangifte
      </h1>

      <BtwAangiftePeriode
        kwartaal={kwartaal}
        jaar={jaar}
        onKwartaalChange={setKwartaal}
        onJaarChange={setJaar}
      />

      {loading && (
        <div className="text-center py-12 text-gray-500" aria-live="polite">
          Laden...
        </div>
      )}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <div aria-live="polite" className="space-y-6">
          <BtwAangifteTabel regels={data.regels} />
          <BtwAangifteTotalen
            verschuldigd={data.totaalVerschuldigd}
            voorbelasting={data.totaalVoorbelasting}
            afTeDragen={data.afTeDragen}
          />
        </div>
      )}
    </div>
  )
}
