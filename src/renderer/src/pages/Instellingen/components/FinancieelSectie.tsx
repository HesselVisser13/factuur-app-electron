// src/renderer/src/pages/Instellingen/components/FinancieelSectie.tsx

import { Landmark } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'

import type { InstellingenFormValues } from '../instellingenFormSchema'

export function FinancieelSectie() {
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Landmark className="w-4 h-4" aria-hidden="true" />
        Financiële gegevens
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="kvk_nummer" className="block text-sm font-medium text-gray-600 mb-1">
            KvK-nummer
          </label>
          <input
            id="kvk_nummer"
            type="text"
            placeholder="12345678"
            {...register('kvk_nummer')}
            className={inputClasses(!!errors.kvk_nummer)}
            aria-invalid={!!errors.kvk_nummer}
          />
          <FormError message={errors.kvk_nummer?.message} />
        </div>

        <div>
          <label htmlFor="btw_nummer" className="block text-sm font-medium text-gray-600 mb-1">
            BTW-nummer
          </label>
          <input
            id="btw_nummer"
            type="text"
            placeholder="NL123456789B01"
            {...register('btw_nummer')}
            className={inputClasses(!!errors.btw_nummer)}
            aria-invalid={!!errors.btw_nummer}
          />
          <FormError message={errors.btw_nummer?.message} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="banknaam" className="block text-sm font-medium text-gray-600 mb-1">
            Banknaam
          </label>
          <input
            id="banknaam"
            type="text"
            placeholder="Mijn Banknaam"
            {...register('banknaam')}
            className={inputClasses(!!errors.banknaam)}
            aria-invalid={!!errors.banknaam}
          />
          <FormError message={errors.banknaam?.message} />
        </div>

        <div>
          <label htmlFor="iban" className="block text-sm font-medium text-gray-600 mb-1">
            IBAN
          </label>
          <input
            id="iban"
            type="text"
            placeholder="NL00 BANK 0000 0000 00"
            {...register('iban')}
            className={inputClasses(!!errors.iban)}
            aria-invalid={!!errors.iban}
          />
          <FormError message={errors.iban?.message} />
        </div>

        <div>
          <label htmlFor="bic" className="block text-sm font-medium text-gray-600 mb-1">
            BIC
          </label>
          <input
            id="bic"
            type="text"
            placeholder="BANKNL2A"
            {...register('bic')}
            className={inputClasses(!!errors.bic)}
            aria-invalid={!!errors.bic}
          />
          <FormError message={errors.bic?.message} />
        </div>

        <div>
          <label
            htmlFor="betaaltermijn_dagen"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Betaaltermijn (dagen)
          </label>
          <input
            id="betaaltermijn_dagen"
            type="number"
            min="1"
            max="90"
            {...register('betaaltermijn_dagen')}
            className={inputClasses(!!errors.betaaltermijn_dagen)}
            aria-invalid={!!errors.betaaltermijn_dagen}
          />
          <FormError message={errors.betaaltermijn_dagen?.message} />
        </div>

        <div>
          <label htmlFor="is_starter" className="block text-sm font-medium text-gray-600 mb-1">
            Starter (kleineondernemersregeling)?
          </label>
          <select
            id="is_starter"
            {...register('is_starter')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="false">Nee</option>
            <option value="true">Ja</option>
          </select>
        </div>
      </div>
    </section>
  )
}
