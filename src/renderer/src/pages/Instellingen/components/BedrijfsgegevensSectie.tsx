// src/renderer/src/pages/Instellingen/components/BedrijfsgegevensSectie.tsx

import { Building2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'

import type { InstellingenFormValues } from '../instellingenFormSchema'

export function BedrijfsgegevensSectie() {
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Building2 className="w-4 h-4" aria-hidden="true" />
        Bedrijfsgegevens
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="bedrijfsnaam" className="block text-sm font-medium text-gray-600 mb-1">
            Bedrijfsnaam
          </label>
          <input
            id="bedrijfsnaam"
            type="text"
            placeholder="Bijv. Warmtepomp Installaties Jansen"
            {...register('bedrijfsnaam')}
            className={inputClasses(!!errors.bedrijfsnaam)}
            aria-invalid={!!errors.bedrijfsnaam}
          />
          <FormError message={errors.bedrijfsnaam?.message} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="eigenaar_naam" className="block text-sm font-medium text-gray-600 mb-1">
            Naam eigenaar
          </label>
          <input
            id="eigenaar_naam"
            type="text"
            placeholder="Bijv. Jan Jansen"
            {...register('eigenaar_naam')}
            className={inputClasses(!!errors.eigenaar_naam)}
            aria-invalid={!!errors.eigenaar_naam}
          />
          <FormError message={errors.eigenaar_naam?.message} />
        </div>

        <div>
          <label htmlFor="telefoon" className="block text-sm font-medium text-gray-600 mb-1">
            Telefoon
          </label>
          <input
            id="telefoon"
            type="tel"
            placeholder="06-12345678"
            {...register('telefoon')}
            className={inputClasses(!!errors.telefoon)}
            aria-invalid={!!errors.telefoon}
          />
          <FormError message={errors.telefoon?.message} />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="info@voorbeeld.nl"
            {...register('email')}
            className={inputClasses(!!errors.email)}
            aria-invalid={!!errors.email}
          />
          <FormError message={errors.email?.message} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="website" className="block text-sm font-medium text-gray-600 mb-1">
            Website
          </label>
          <input
            id="website"
            type="url"
            placeholder="https://www.voorbeeld.nl"
            {...register('website')}
            className={inputClasses(!!errors.website)}
            aria-invalid={!!errors.website}
          />
          <FormError message={errors.website?.message} />
        </div>
      </div>
    </section>
  )
}
