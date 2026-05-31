// src/renderer/src/pages/Instellingen/components/BelastingProfielSectie.tsx

import { Calculator } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { inputClasses } from '@renderer/utils/inputClasses'

import type { InstellingenFormValues } from '../instellingenFormSchema'

export function BelastingProfielSectie() {
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Calculator className="w-4 h-4" aria-hidden="true" />
        Belastingprofiel
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Deze gegevens worden gebruikt voor de IB-schatting. Alles blijft lokaal opgeslagen.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="voldoet_urencriterium"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Voldoe je aan het urencriterium?
          </label>
          <select
            id="voldoet_urencriterium"
            {...register('voldoet_urencriterium')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="false">Nee</option>
            <option value="true">Ja (&gt;1.225 uur/jaar)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Recht op zelfstandigenaftrek (&euro;2.470).</p>
        </div>

        <div>
          <label htmlFor="is_starter_ib" className="block text-sm font-medium text-gray-600 mb-1">
            Ben je starter? (eerste 3 jaar)
          </label>
          <select
            id="is_starter_ib"
            {...register('is_starter_ib')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="false">Nee</option>
            <option value="true">Ja</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Recht op startersaftrek (&euro;2.123). Vereist urencriterium.
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="loon_inkomen" className="block text-sm font-medium text-gray-600 mb-1">
            Bruto loon-inkomen per jaar (uit loondienst, etc.)
          </label>
          <input
            id="loon_inkomen"
            type="number"
            step="1000"
            min="0"
            placeholder="0"
            {...register('loon_inkomen')}
            className={inputClasses(!!errors.loon_inkomen)}
            aria-invalid={!!errors.loon_inkomen}
          />
          <FormError message={errors.loon_inkomen?.message} />
          {!errors.loon_inkomen && (
            <p className="text-xs text-gray-500 mt-1">
              Geef je bruto-jaarinkomen op voor een nauwkeurigere schatting. Laat leeg als je alleen
              ZZP-inkomen hebt.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
