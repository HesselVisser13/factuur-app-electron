// src/renderer/src/components/document-form/RegelRow.tsx

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'

import { FormError } from '@renderer/components/FormError'
import { INPUT_BASE_SMALL, inputClasses } from '@renderer/utils/inputClasses'
import { formatCents } from '@renderer/utils/money'
import type { BtwTarief } from '@shared/types'

import { berekenRegel } from './berekenen'
import type { DocumentFormShape } from './types'

interface Props {
  index: number
  total: number
  tarieven: BtwTarief[]
  readOnly: boolean
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

export function RegelRow({ index, total, tarieven, readOnly, onMove, onRemove }: Props) {
  const {
    register,
    control,
    setValue,
    formState: { errors }
  } = useFormContext<DocumentFormShape>()

  const regel = useWatch({ control, name: `regels.${index}` })
  const bedragen = berekenRegel(regel)

  const regelErrors = errors.regels?.[index]
  const cls = (hasErr: boolean): string => inputClasses(hasErr, INPUT_BASE_SMALL)

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 md:col-span-2">
          <label className="block text-xs text-gray-500 mb-0.5">Datum</label>
          <input
            type="date"
            disabled={readOnly}
            {...register(`regels.${index}.datum`)}
            className={cls(!!regelErrors?.datum)}
            aria-invalid={!!regelErrors?.datum}
          />
          <FormError message={regelErrors?.datum?.message} className="mt-0.5" />
        </div>

        <div className="col-span-12 md:col-span-4">
          <label className="block text-xs text-gray-500 mb-0.5">Omschrijving</label>
          <input
            type="text"
            disabled={readOnly}
            placeholder="bv. Installatie warmtepomp"
            {...register(`regels.${index}.omschrijving`)}
            className={cls(!!regelErrors?.omschrijving)}
            aria-invalid={!!regelErrors?.omschrijving}
          />
          <FormError message={regelErrors?.omschrijving?.message} className="mt-0.5" />
        </div>

        <div className="col-span-4 md:col-span-1">
          <label className="block text-xs text-gray-500 mb-0.5">Aantal</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            disabled={readOnly}
            {...register(`regels.${index}.aantal`)}
            className={cls(!!regelErrors?.aantal)}
            aria-invalid={!!regelErrors?.aantal}
          />
          <FormError message={regelErrors?.aantal?.message} className="mt-0.5" />
        </div>

        <div className="col-span-4 md:col-span-2">
          <label className="block text-xs text-gray-500 mb-0.5">Stuksprijs</label>
          <input
            type="number"
            step="0.01"
            min="0"
            disabled={readOnly}
            placeholder="0.00"
            {...register(`regels.${index}.prijsPerStuk`)}
            className={cls(!!regelErrors?.prijsPerStuk)}
            aria-invalid={!!regelErrors?.prijsPerStuk}
          />
          <FormError message={regelErrors?.prijsPerStuk?.message} className="mt-0.5" />
        </div>

        <div className="col-span-4 md:col-span-1">
          <label className="block text-xs text-gray-500 mb-0.5">BTW</label>
          <Controller
            control={control}
            name={`regels.${index}.btwTariefId`}
            render={({ field }) => (
              <select
                disabled={readOnly}
                value={field.value}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10)
                  const tarief = tarieven.find((t) => t.id === id)
                  if (!tarief) return
                  field.onChange(tarief.id)
                  setValue(`regels.${index}.btwPercentage`, tarief.percentage, {
                    shouldValidate: true,
                    shouldDirty: true
                  })
                }}
                className={cls(!!regelErrors?.btwTariefId)}
                aria-invalid={!!regelErrors?.btwTariefId}
              >
                {tarieven.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.percentage}%
                  </option>
                ))}
              </select>
            )}
          />
          <FormError message={regelErrors?.btwTariefId?.message} className="mt-0.5" />
        </div>

        <div className="col-span-12 md:col-span-2 flex items-end">
          <div className="w-full text-right font-medium text-sm py-1">
            {formatCents(bedragen.bedragInclCents)}
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-500">
            Excl: {formatCents(bedragen.bedragExclCents)} · BTW:{' '}
            {formatCents(bedragen.btwBedragCents)}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label="Regel omhoog"
              title="Naar boven"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
            >
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
              aria-label="Regel omlaag"
              title="Naar beneden"
              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
            >
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Regel verwijderen"
              title="Verwijderen"
              className="p-1.5 text-red-600 hover:bg-red-100 rounded inline-flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Verwijder</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
