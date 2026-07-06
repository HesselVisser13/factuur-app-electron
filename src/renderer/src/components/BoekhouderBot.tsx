// src/renderer/src/components/BoekhouderBot.tsx

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Lightbulb, AlertTriangle, Wallet, CheckCircle2, ArrowRight } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { adviesApi } from '../api/advies'
import type { BoekhouderAdvies } from '@shared/types'

interface BoekhouderBotProps {
  jaar?: number
}

function AdviesIcoon({ type }: { type: BoekhouderAdvies['type'] }) {
  switch (type) {
    case 'tip':
      return <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0" />
    case 'waarschuwing':
      return <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
    case 'actie':
      return <Wallet className="w-5 h-5 text-red-600 flex-shrink-0" />
    case 'succes':
      return <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
    default:
      return <Lightbulb className="w-5 h-5 text-gray-600 flex-shrink-0" />
  }
}

export function BoekhouderBot({ jaar = new Date().getFullYear() }: BoekhouderBotProps) {
  const { data: adviezen, loading, error } = useApi(() => adviesApi.getAdviezen(jaar), [jaar])

  const botKleur = useMemo(() => {
    if (!adviezen) return 'bg-blue-50 border-blue-200'
    if (adviezen.some((a) => a.type === 'waarschuwing')) return 'bg-orange-50 border-orange-200'
    if (adviezen.some((a) => a.type === 'actie')) return 'bg-red-50 border-red-200'
    if (adviezen.some((a) => a.type === 'succes')) return 'bg-green-50 border-green-200'
    return 'bg-blue-50 border-blue-200'
  }, [adviezen])

  if (loading) {
    return (
      <div className="animate-pulse h-32 bg-gray-100 rounded-xl border border-gray-200 m-4"></div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Kon de boekhouder niet bereiken</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-5 transition-colors duration-300 ${botKleur}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <Briefcase className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">Digitale Boekhouder</h2>
          <p className="text-sm text-gray-500">Kijkt proactief mee met de cijfers van {jaar}</p>
        </div>
      </div>

      <div className="space-y-3">
        {adviezen?.map((advies) => (
          <div
            key={advies.id}
            className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm flex items-start gap-3"
          >
            <AdviesIcoon type={advies.type} />

            <div className="flex-1">
              <h3 className="font-medium text-gray-800 mb-1">{advies.titel}</h3>
              <p className="text-gray-600 text-sm mb-3">{advies.bericht}</p>

              {advies.actieLabel && advies.actieRoute && (
                <Link
                  to={advies.actieRoute}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                >
                  {advies.actieLabel}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
