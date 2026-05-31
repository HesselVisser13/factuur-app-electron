// src/renderer/src/pages/Belasting/Belasting.tsx

import { AlertTriangle, Info, PiggyBank } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { belastingApi, instellingenApi } from '@renderer/api'
import { useToast } from '@renderer/components/Toast'
import { formatCents, type Cents } from '@renderer/utils/money'
import type { BelastingSchatting } from '@shared/types'

export function Belasting() {
  const toast = useToast()

  const [jaar, setJaar] = useState(new Date().getFullYear())
  const [schatting, setSchatting] = useState<BelastingSchatting | null>(null)
  const [loading, setLoading] = useState(true)
  const [profielCompleet, setProfielCompleet] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const instellingen = await instellingenApi.getAll()

      // Check of profiel is ingevuld
      const heeftLoonInput = instellingen.loon_inkomen !== undefined
      if (!heeftLoonInput) {
        setProfielCompleet(false)
        return
      }

      setProfielCompleet(true)

      const result = await belastingApi.bereken({
        jaar,
        voldoetUrencriterium: instellingen.voldoet_urencriterium === 'true',
        isStarter: instellingen.is_starter_ib === 'true',
        loonInkomen: parseFloat(instellingen.loon_inkomen || '0') || 0
      })
      setSchatting(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Schatting laden mislukt')
    } finally {
      setLoading(false)
    }
  }, [jaar, toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PiggyBank className="w-7 h-7 text-blue-600" aria-hidden="true" />
          Belastingschatting
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Schatting van je inkomstenbelasting voor reserveringsdoeleinden.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-amber-900">
          <strong>Indicatieve berekening — geen fiscaal advies.</strong>
          <p className="mt-1">
            Deze tool toont een grove schatting voor reservering. De werkelijke aanslag wordt
            berekend door de Belastingdienst en kan afwijken door persoonlijke factoren
            (heffingskortingen, partner, hypotheek, etc.). Gebruik altijd de Vooraf Ingevulde
            Aangifte op{' '}
            <a
              href="https://www.belastingdienst.nl/zzp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              belastingdienst.nl/zzp
            </a>
            .
          </p>
        </div>
      </div>

      {/* Jaar-selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Belastingjaar</label>
        <select
          value={jaar}
          onChange={(e) => setJaar(parseInt(e.target.value, 10))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          {[0, 1, 2].map((offset) => {
            const j = new Date().getFullYear() - offset
            return (
              <option key={j} value={j}>
                {j}
              </option>
            )
          })}
        </select>
      </div>

      {!profielCompleet ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Info className="w-8 h-8 text-blue-600 mx-auto mb-2" aria-hidden="true" />
          <h2 className="text-lg font-bold text-blue-900 mb-2">Profiel onvolledig</h2>
          <p className="text-sm text-blue-800 mb-4">
            Vul je belastingprofiel in via Instellingen om een schatting te zien.
          </p>
          <a
            href="#/instellingen"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Naar Instellingen
          </a>
        </div>
      ) : loading ? (
        <div className="text-center text-gray-500 py-12">Berekenen...</div>
      ) : !schatting ? (
        <div className="text-center text-gray-500 py-12">Geen data</div>
      ) : (
        <SchattingContent schatting={schatting} />
      )}
    </div>
  )
}

function SchattingContent({ schatting }: { schatting: BelastingSchatting }) {
  const isVerlies = schatting.zzpWinst === 0

  return (
    <>
      {/* Hoofd-reservering KPI */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Reservering aanbevolen
        </div>

        {isVerlies ? (
          <div className="text-gray-700 text-sm">
            <strong>Geen reservering nodig.</strong> Je uitgaven zijn hoger dan je omzet voor dit
            jaar. Geen winst = geen IB.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReserveringKaart
              label="Veilig (40%)"
              tooltip="Conservatieve schatting, neemt geen aftrekposten mee"
              bedrag={schatting.ibConservatief as Cents}
              perMaand={schatting.reserveringPerMaandConservatief as Cents}
              variant="default"
            />
            <ReserveringKaart
              label={`Geschat (${schatting.marginaalTarief}%)`}
              tooltip="Op basis van marginaal tarief en aftrekposten"
              bedrag={schatting.ibGeschat as Cents}
              perMaand={schatting.reserveringPerMaandGeschat as Cents}
              variant="primary"
            />
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 self-stretch flex flex-col justify-center">
              <strong className="text-gray-900 block mb-1">💡 Advies</strong>
              <p>
                Reserveer maandelijks{' '}
                <strong>{formatCents(schatting.reserveringPerMaandGeschat as Cents)}</strong> op een
                aparte rekening. Houd de veilige schatting aan als marge.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Berekening detail */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Berekening</h2>

        <div className="space-y-2 text-sm">
          <DetailRij label="ZZP omzet" bedrag={schatting.zzpOmzet} />
          <DetailRij label="ZZP uitgaven" bedrag={-schatting.zzpUitgaven} />
          <DetailRij label="Winst" bedrag={schatting.zzpWinst} bold />

          {schatting.zelfstandigenaftrek > 0 && (
            <DetailRij label="Zelfstandigenaftrek" bedrag={-schatting.zelfstandigenaftrek} muted />
          )}

          {schatting.startersaftrek > 0 && (
            <DetailRij label="Startersaftrek" bedrag={-schatting.startersaftrek} muted />
          )}

          {schatting.mkbVrijstelling > 0 && (
            <DetailRij
              label="MKB-winstvrijstelling (13,31%)"
              bedrag={-schatting.mkbVrijstelling}
              muted
            />
          )}

          <div className="border-t border-gray-300 pt-2">
            <DetailRij label="Belastbare winst" bedrag={schatting.belastbareWinst} bold />
          </div>

          <div className="border-t-2 border-gray-900 pt-2 mt-2">
            <DetailRij
              label={`Geschatte IB (${schatting.marginaalTarief}%)`}
              bedrag={schatting.ibGeschat}
              bold
            />
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 italic">
          Heffingskortingen niet meegenomen. Werkelijke aanslag kan lager uitvallen.
        </div>
      </div>
    </>
  )
}

interface ReserveringKaartProps {
  label: string
  tooltip: string
  bedrag: Cents
  perMaand: Cents
  variant: 'default' | 'primary'
}

function ReserveringKaart({ label, tooltip, bedrag, perMaand, variant }: ReserveringKaartProps) {
  const colors = variant === 'primary' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'

  return (
    <div className={`rounded-lg border p-4 ${colors}`} title={tooltip}>
      <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{formatCents(bedrag)}</div>
      <div className="text-xs text-gray-500 mt-1">≈ {formatCents(perMaand)} per maand</div>
    </div>
  )
}

interface DetailRijProps {
  label: string
  bedrag: number // cents
  bold?: boolean
  muted?: boolean
}

function DetailRij({ label, bedrag, bold, muted }: DetailRijProps) {
  const className = [
    'flex justify-between',
    bold ? 'font-bold' : '',
    muted ? 'text-gray-500' : 'text-gray-900'
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <span>{label}</span>
      <span className="tabular-nums">
        {bedrag < 0 ? '-' : ''}
        {formatCents(Math.abs(bedrag) as Cents)}
      </span>
    </div>
  )
}
