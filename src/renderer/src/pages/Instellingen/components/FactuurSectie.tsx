// src/renderer/src/pages/Instellingen/components/FactuurSectie.tsx

import { FileText } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'

import type { InstellingenFormValues } from '../instellingenFormSchema'

import { LogoUpload } from './LogoUpload'

export function FactuurSectie() {
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" aria-hidden="true" />
        Factuur
      </h2>

      <div className="space-y-4">
        <LogoUpload />

        <div>
          <label
            htmlFor="factuur_voorwaarden"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Voorwaardentekst onderaan factuur
          </label>
          <textarea
            id="factuur_voorwaarden"
            rows={3}
            {...register('factuur_voorwaarden')}
            className={inputClasses(!!errors.factuur_voorwaarden)}
            aria-invalid={!!errors.factuur_voorwaarden}
          />
          <FormError message={errors.factuur_voorwaarden?.message} />
          {!errors.factuur_voorwaarden && (
            <p className="text-xs text-gray-500 mt-1">
              Tip: gebruik <code className="bg-gray-100 px-1 rounded">{'{betaaltermijn}'}</code> om
              het aantal dagen automatisch in te vullen.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
