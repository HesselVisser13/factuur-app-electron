// src/renderer/src/components/document-form/ReistijdSectie.tsx

import { AlertTriangle, Car } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { FormError } from '@renderer/components/FormError'
import { formatCurrency } from '@renderer/utils/formatters'
import { inputClasses } from '@renderer/utils/inputClasses'
import { formatCents } from '@renderer/utils/money'
import type { BtwTarief } from '@shared/types'

import { berekenReistijd } from './berekenen'
import type { DocumentFormShape, ReistijdInstellingen } from './types'

interface Props {
  tarieven: BtwTarief[]
  instellingen: ReistijdInstellingen
  readOnly: boolean
}

export function ReistijdSectie({ tarieven, instellingen, readOnly }: Props) {
  const navigate = useNavigate()
  const {
    register,
    setValue,
    control,
    formState: { errors }
  } = useFormContext<DocumentFormShape>()

  const reistijd = useWatch({ control, name: 'reistijd' })
  const bedrag = berekenReistijd(reistijd, instellingen)
  const reistijdErrors = errors.reistijd

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Car className="w-4 h-4" aria-hidden="true" />
          Reistijd
        </h2>
        {!readOnly && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register('reistijd.enabled')} className="rounded" />
            Reistijd toepassen
          </label>
        )}
      </div>

      {!reistijd.enabled ? (
        <p className="text-sm text-gray-500">
          Vink &quot;Reistijd toepassen&quot; aan om reistijd toe te voegen.
        </p>
      ) : (
        <>
          {instellingen.uurtarief === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Er is nog geen uurtarief voor reistijd ingesteld. Ga naar{' '}
                <button
                  type="button"
                  onClick={() => navigate('/instellingen')}
                  className="underline font-medium"
                >
                  Instellingen → Reiskosten
                </button>{' '}
                om dit in te stellen.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Reistijd (uur)</label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                disabled={readOnly}
                {...register('reistijd.uren')}
                className={inputClasses(!!reistijdErrors?.uren)}
                aria-invalid={!!reistijdErrors?.uren}
              />
              <FormError message={reistijdErrors?.uren?.message} />
              {instellingen.uurtarief > 0 && !reistijdErrors?.uren && (
                <p className="text-xs text-gray-500 mt-1">
                  {reistijd.uren || '0'} × {formatCurrency(instellingen.uurtarief)} ={' '}
                  {formatCurrency((parseFloat(reistijd.uren) || 0) * instellingen.uurtarief)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Kilometers <span className="text-gray-400 font-normal">— optioneel</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={readOnly || instellingen.kmtarief === 0}
                placeholder={instellingen.kmtarief > 0 ? '0' : 'Geen km-tarief ingesteld'}
                {...register('reistijd.km')}
                className={inputClasses(!!reistijdErrors?.km)}
                aria-invalid={!!reistijdErrors?.km}
              />
              <FormError message={reistijdErrors?.km?.message} />
              {instellingen.kmtarief > 0 && reistijd.km && !reistijdErrors?.km && (
                <p className="text-xs text-gray-500 mt-1">
                  {reistijd.km} × {formatCurrency(instellingen.kmtarief)} ={' '}
                  {formatCurrency((parseFloat(reistijd.km) || 0) * instellingen.kmtarief)}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Omschrijving</label>
              <input
                type="text"
                disabled={readOnly}
                {...register('reistijd.omschrijving')}
                className={inputClasses(!!reistijdErrors?.omschrijving)}
                aria-invalid={!!reistijdErrors?.omschrijving}
              />
              <FormError message={reistijdErrors?.omschrijving?.message} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">BTW-tarief</label>
              <select
                disabled={readOnly}
                {...register('reistijd.btwTariefId', {
                  setValueAs: (v) => (v === '' ? null : parseInt(v, 10)),
                  onChange: (e) => {
                    const id = parseInt(e.target.value, 10)
                    const t = tarieven.find((tt) => tt.id === id)
                    if (t) setValue('reistijd.btwPercentage', t.percentage)
                  }
                })}
                className={inputClasses(!!reistijdErrors?.btwTariefId)}
                aria-invalid={!!reistijdErrors?.btwTariefId}
              >
                <option value="">-- Kies tarief --</option>
                {tarieven.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.naam} ({t.percentage}%)
                  </option>
                ))}
              </select>
              <FormError message={reistijdErrors?.btwTariefId?.message} />
            </div>

            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotaal excl. BTW</span>
                <span className="font-medium">{formatCents(bedrag.bedragExclCents)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>BTW {reistijd.btwPercentage}%</span>
                <span>{formatCents(bedrag.btwBedragCents)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-blue-200">
                <span>Totaal incl. BTW</span>
                <span>{formatCents(bedrag.bedragInclCents)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
