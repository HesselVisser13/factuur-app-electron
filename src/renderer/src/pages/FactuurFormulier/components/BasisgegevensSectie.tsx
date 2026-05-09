// src/renderer/src/pages/FactuurFormulier/components/BasisgegevensSectie.ts

import { useFormContext } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'
import { klantDisplayNaam } from '@shared/klant-utils'
import type { Klant } from '@shared/types'
import type { FactuurFormValues } from '../factuurFormSchema'

interface Props {
  klanten: Klant[]
  factuurNummer: string
  readOnly: boolean
}

export function BasisgegevensSectie({ klanten, factuurNummer, readOnly }: Props) {
  const navigate = useNavigate()
  const {
    register,
    formState: { errors }
  } = useFormContext<FactuurFormValues>()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
        Factuurgegevens
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Klant *</label>
          <select
            disabled={readOnly}
            {...register('klantId', {
              setValueAs: (v) => (v === '' || v === null ? null : parseInt(v, 10))
            })}
            className={inputClasses(!!errors.klantId)}
            aria-invalid={!!errors.klantId}
          >
            <option value="">-- Kies een klant --</option>
            {klanten.map((k) => (
              <option key={k.id} value={k.id}>
                {klantDisplayNaam(k)}
                {k.plaats ? ` (${k.plaats})` : ''}
              </option>
            ))}
          </select>
          <FormError message={errors.klantId?.message} />
          {klanten.length === 0 && (
            <p className="text-xs text-red-600 mt-1">
              Geen klanten gevonden.{' '}
              <button type="button" onClick={() => navigate('/klanten')} className="underline">
                Maak eerst een klant aan
              </button>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Factuurnummer</label>
          <input
            type="text"
            readOnly
            value={factuurNummer}
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Referentie</label>
          <input
            type="text"
            disabled={readOnly}
            placeholder="bv. inkoopnummer klant"
            {...register('referentie')}
            className={inputClasses(!!errors.referentie)}
            aria-invalid={!!errors.referentie}
          />
          <FormError message={errors.referentie?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Factuurdatum *</label>
          <input
            type="date"
            disabled={readOnly}
            {...register('datum')}
            className={inputClasses(!!errors.datum)}
            aria-invalid={!!errors.datum}
          />
          <FormError message={errors.datum?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vervaldatum *</label>
          <input
            type="date"
            disabled={readOnly}
            {...register('vervalDatum')}
            className={inputClasses(!!errors.vervalDatum)}
            aria-invalid={!!errors.vervalDatum}
          />
          <FormError message={errors.vervalDatum?.message} />
        </div>
      </div>
    </div>
  )
}
