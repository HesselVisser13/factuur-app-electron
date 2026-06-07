// src/renderer/src/components/document-form/RegelsSectie.tsx

import { AlertTriangle } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { STANDAARD_TARIEF_NAAM, vindTariefOpNaam } from '@shared/constants'
import type { BtwTarief } from '@shared/types'

import { RegelRow } from './RegelRow'
import { emptyRegel, type DocumentFormShape } from './types'

interface Props {
  tarieven: BtwTarief[]
  readOnly: boolean
  /** Sectie-titel — bv. "Factuurregels" of "Offerteregels" */
  title?: string
}

export function RegelsSectie({ tarieven, readOnly, title = 'Regels' }: Props) {
  const { control, formState } = useFormContext<DocumentFormShape>()
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
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</h2>
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
            {rootError ?? 'Voeg minstens één regel toe'}
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <RegelRow
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
