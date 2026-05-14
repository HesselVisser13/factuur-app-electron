// src/renderer/src/pages/Instellingen/components/ReiskostenSectie.tsx

import { Car } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'
import type { BtwTarief } from '@shared/types'

import type { InstellingenFormValues } from '../instellingenFormSchema'

interface Props {
  tarieven: BtwTarief[]
}

export function ReiskostenSectie({ tarieven }: Props) {
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Car className="w-4 h-4" aria-hidden="true" />
        Reiskosten
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="reiskosten_uurtarief"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Uurtarief reistijd (€)
          </label>
          <input
            id="reiskosten_uurtarief"
            type="number"
            step="0.01"
            min="0"
            placeholder="55,00"
            {...register('reiskosten_uurtarief')}
            className={inputClasses(!!errors.reiskosten_uurtarief)}
            aria-invalid={!!errors.reiskosten_uurtarief}
          />
          <FormError message={errors.reiskosten_uurtarief?.message} />
          {!errors.reiskosten_uurtarief && (
            <p className="text-xs text-gray-500 mt-1">
              Wordt vermenigvuldigd met aantal halve uren reistijd.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="reiskosten_kmtarief"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Km-tarief (€) <span className="text-gray-400 font-normal">— optioneel</span>
          </label>
          <input
            id="reiskosten_kmtarief"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,21"
            {...register('reiskosten_kmtarief')}
            className={inputClasses(!!errors.reiskosten_kmtarief)}
            aria-invalid={!!errors.reiskosten_kmtarief}
          />
          <FormError message={errors.reiskosten_kmtarief?.message} />
          {!errors.reiskosten_kmtarief && (
            <p className="text-xs text-gray-500 mt-1">
              Vul in als je ook kilometers wilt doorberekenen.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="reiskosten_btw_tarief_id"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Standaard BTW-tarief
          </label>
          <select
            id="reiskosten_btw_tarief_id"
            {...register('reiskosten_btw_tarief_id')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">-- Kies tarief --</option>
            {tarieven.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naam} ({t.percentage}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="reiskosten_omschrijving"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Standaard omschrijving
          </label>
          <input
            id="reiskosten_omschrijving"
            type="text"
            placeholder="Reistijd"
            {...register('reiskosten_omschrijving')}
            className={inputClasses(!!errors.reiskosten_omschrijving)}
            aria-invalid={!!errors.reiskosten_omschrijving}
          />
          <FormError message={errors.reiskosten_omschrijving?.message} />
          {!errors.reiskosten_omschrijving && (
            <p className="text-xs text-gray-500 mt-1">
              Verschijnt op de factuur als omschrijving van de reisregel.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
