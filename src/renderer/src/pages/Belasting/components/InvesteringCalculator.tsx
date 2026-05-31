// src/renderer/src/pages/Belasting/components/InvesteringCalculator.tsx

import { Calculator } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { belastingApi, btwTarievenApi } from '@renderer/api'
import { useToast } from '@renderer/components/Toast'
import { formatCents, type Cents } from '@renderer/utils/money'
import type { BtwTarief, InvesteringResultaat } from '@shared/types'

type Invoerwijze = 'inclusief' | 'exclusief'

export function InvesteringCalculator() {
  const toast = useToast()

  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [bedrag, setBedrag] = useState<string>('')
  const [invoerwijze, setInvoerwijze] = useState<Invoerwijze>('inclusief')
  const [btwTariefId, setBtwTariefId] = useState<number | null>(null)
  const [resultaat, setResultaat] = useState<InvesteringResultaat | null>(null)

  // Laad tarieven en kies hoog tarief als default
  useEffect(() => {
    void (async () => {
      try {
        const data = await btwTarievenApi.getActief()
        setTarieven(data)
        const hoog = data.find((t) => t.naam === 'Hoog tarief') ?? data[0]
        if (hoog) setBtwTariefId(hoog.id)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Tarieven laden mislukt')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Berekenen bij elke wijziging (debounced via React batching)
  const tarief = useMemo(
    () => tarieven.find((t) => t.id === btwTariefId) ?? null,
    [tarieven, btwTariefId]
  )

  useEffect(() => {
    const bedragNum = parseFloat(bedrag.replace(',', '.'))
    if (isNaN(bedragNum) || bedragNum <= 0 || !tarief) {
      setResultaat(null)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const result = await belastingApi.berekenInvestering({
          bedrag: bedragNum,
          invoerwijze,
          btwPercentage: tarief.percentage
        })
        if (!cancelled) setResultaat(result)
      } catch {
        if (!cancelled) setResultaat(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [bedrag, invoerwijze, tarief])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-2">
        <Calculator className="w-4 h-4" aria-hidden="true" />
        Investering calculator
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Bereken hoeveel BTW je terugkrijgt en wat je investering effectief kost.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="invest-bedrag" className="block text-sm font-medium text-gray-600 mb-1">
            Bedrag (€)
          </label>
          <input
            id="invest-bedrag"
            type="number"
            step="0.01"
            min="0"
            placeholder="1200,00"
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="invest-invoerwijze"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Bedrag is
          </label>
          <select
            id="invest-invoerwijze"
            value={invoerwijze}
            onChange={(e) => setInvoerwijze(e.target.value as Invoerwijze)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="inclusief">Inclusief BTW</option>
            <option value="exclusief">Exclusief BTW</option>
          </select>
        </div>

        <div>
          <label htmlFor="invest-btw" className="block text-sm font-medium text-gray-600 mb-1">
            BTW-tarief
          </label>
          <select
            id="invest-btw"
            value={btwTariefId ?? ''}
            onChange={(e) => setBtwTariefId(parseInt(e.target.value, 10) || null)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            {tarieven.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naam} ({t.percentage}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {resultaat ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResultaatKaart
            label="Bedrag excl. BTW"
            bedrag={resultaat.bedragExcl as Cents}
            sub="Effectieve kosten"
            tone="default"
          />
          <ResultaatKaart
            label="BTW terug te vorderen"
            bedrag={resultaat.btwTerug as Cents}
            sub={`${resultaat.btwPercentage}%`}
            tone="success"
          />
          <ResultaatKaart
            label="Bedrag incl. BTW"
            bedrag={resultaat.bedragIncl as Cents}
            sub="Wat je betaalt"
            tone="default"
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-500">
          Vul een bedrag in om de berekening te zien.
        </div>
      )}
    </div>
  )
}

interface ResultaatKaartProps {
  label: string
  bedrag: Cents
  sub: string
  tone: 'default' | 'success'
}

function ResultaatKaart({ label, bedrag, sub, tone }: ResultaatKaartProps) {
  const colors =
    tone === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-gray-50 border-gray-200 text-gray-900'

  return (
    <div className={`rounded-lg border p-4 ${colors}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{formatCents(bedrag)}</div>
      <div className="text-xs opacity-60 mt-1">{sub}</div>
    </div>
  )
}
