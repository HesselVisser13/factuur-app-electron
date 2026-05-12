// src/renderer/src/pages/Instellingen/components/AdresSectie.ts

import { useFormContext } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'

import type { InstellingenFormValues } from '../instellingenFormSchema'

export function AdresSectie() {
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Adres</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="adres" className="block text-sm font-medium text-gray-600 mb-1">
            Straat + huisnummer
          </label>
          <input
            id="adres"
            type="text"
            placeholder="Werkstraat 1"
            {...register('adres')}
            className={inputClasses(!!errors.adres)}
            aria-invalid={!!errors.adres}
          />
          <FormError message={errors.adres?.message} />
        </div>

        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-600 mb-1">
            Postcode
          </label>
          <input
            id="postcode"
            type="text"
            placeholder="1234 AB"
            {...register('postcode')}
            className={inputClasses(!!errors.postcode)}
            aria-invalid={!!errors.postcode}
          />
          <FormError message={errors.postcode?.message} />
        </div>

        <div>
          <label htmlFor="plaats" className="block text-sm font-medium text-gray-600 mb-1">
            Plaats
          </label>
          <input
            id="plaats"
            type="text"
            placeholder="Amsterdam"
            {...register('plaats')}
            className={inputClasses(!!errors.plaats)}
            aria-invalid={!!errors.plaats}
          />
          <FormError message={errors.plaats?.message} />
        </div>
      </div>
    </section>
  )
}
