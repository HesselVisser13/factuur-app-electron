// src/renderer/src/components/document-form/TotalenSectie.tsx

import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { formatCents } from '@renderer/utils/money'

import { berekenReistijd, berekenTotalen } from './berekenen'
import type { DocumentFormShape, ReistijdInstellingen } from './types'

interface Props {
  instellingen: ReistijdInstellingen
  /** Label onderaan: "Te betalen" voor factuur, "Totaal" voor offerte */
  totaalLabel?: string
}

export function TotalenSectie({ instellingen, totaalLabel = 'Totaal' }: Props) {
  const { control } = useFormContext<DocumentFormShape>()
  const regels = useWatch({ control, name: 'regels' })
  const reistijd = useWatch({ control, name: 'reistijd' })

  const totalen = useMemo(() => {
    const reistijdBedrag = berekenReistijd(reistijd, instellingen)
    return berekenTotalen(regels ?? [], reistijd, reistijdBedrag)
  }, [regels, reistijd, instellingen])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Totalen</h2>

      <div className="space-y-2 max-w-md ml-auto">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Totaal excl. BTW</span>
          <span className="font-medium">{formatCents(totalen.totaalExclCents)}</span>
        </div>

        {totalen.perTarief.length > 0 && (
          <div className="border-t border-gray-100 pt-2 space-y-1">
            {totalen.perTarief.map((t) => (
              <div key={t.percentage} className="flex justify-between text-xs text-gray-500">
                <span>
                  BTW {t.percentage}% over {formatCents(t.overCents)}
                </span>
                <span>{formatCents(t.btwCents)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
          <span className="text-gray-600">Totaal BTW</span>
          <span className="font-medium">{formatCents(totalen.totaalBtwCents)}</span>
        </div>

        <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2">
          <span>{totaalLabel}</span>
          <span>{formatCents(totalen.totaalInclCents)}</span>
        </div>
      </div>
    </div>
  )
}
