// src/renderer/src/pages/OfferteFormulier/components/DocumentTypeSectie.tsx

import { useFormContext } from 'react-hook-form'

interface Props {
  readOnly?: boolean
}

export function DocumentTypeSectie({ readOnly }: Props) {
  const { register, watch } = useFormContext()

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Document type</h3>
        <p className="text-sm text-gray-500">
          Kies of dit een bindende offerte of een vrijblijvende prijsopgave is.
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          disabled={readOnly}
          {...register('isPrijsopgave')}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-700 w-24">
          {watch('isPrijsopgave') ? 'Prijsopgave' : 'Offerte'}
        </span>
      </label>
    </div>
  )
}
