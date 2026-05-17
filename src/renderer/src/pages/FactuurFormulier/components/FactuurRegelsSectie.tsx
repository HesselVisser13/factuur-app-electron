// src/renderer/src/pages/FactuurFormulier/components/FactuurRegelsSectie.tsx

import { useFieldArray, useFormContext } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'

import type { BtwTarief } from '@shared/types'
import { FactuurRegelRow } from './FactuurRegelRow'
import { type FactuurFormValues } from '../factuurFormSchema'
import { emptyRegel } from '../types'
import { vindTariefOpNaam, STANDAARD_TARIEF_NAAM } from '@shared/constants'

interface Props {
  tarieven: BtwTarief[]
  readOnly: boolean
}

export function FactuurRegelsSectie({ tarieven, readOnly }: Props) {
  const { control, formState } = useFormContext<FactuurFormValues>()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'regels',
    keyName: 'rhfId'
  })

  const rootError = formState.errors.regels?.root?.message ?? formState.errors.regels?.message

  const handleAdd = () => {
    const standaardTarief = vindTariefOpNaam(tarieven, STANDAARD_TARIEF_NAAM) ?? tarieven[0]
    if (!standaardTarief) return
    append(emptyRegel(standaardTarief))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Factuurregels</h2>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAdd}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Regel toevoegen
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="text-center text-red-600 text-sm py-8 bg-red-50 border border-red-200 rounded-lg">
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {rootError ?? 'Voeg minstens één factuurregel toe'}
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <FactuurRegelRow
              key={field.rhfId}
              index={index}
              total={fields.length}
              tarieven={tarieven}
              readOnly={readOnly}
              onMove={(direction) => move(index, index + direction)}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
