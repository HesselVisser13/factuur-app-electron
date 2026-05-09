// src/renderer/src/pages/FactuurFormulier/components/OpmerkingenSectie.ts

import { useFormContext } from 'react-hook-form'
import { FormError } from '@renderer/components/FormError'
import type { FactuurFormValues } from '../factuurFormSchema'

interface Props {
  readOnly: boolean
}

export function OpmerkingenSectie({ readOnly }: Props) {
  const {
    register,
    formState: { errors }
  } = useFormContext<FactuurFormValues>()

  const hasError = !!errors.opmerkingen

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Opmerkingen</h2>
      <textarea
        disabled={readOnly}
        rows={3}
        placeholder="Optionele opmerkingen voor op de factuur..."
        {...register('opmerkingen')}
        className={`w-full border rounded-lg px-4 py-2 text-sm disabled:bg-gray-50 ${
          hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
        aria-invalid={hasError}
      />
      <FormError message={errors.opmerkingen?.message} />
    </div>
  )
}
