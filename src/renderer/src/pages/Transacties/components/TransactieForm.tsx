// src/renderer/src/pages/Transacties/components/TransactieForm.tsx

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { AlertTriangle, Loader2, Check } from 'lucide-react'

import { transactiesApi } from '@renderer/api'
import { FormError } from '@renderer/components/FormError'
import { useToast } from '@renderer/components/Toast'
import { inputClasses } from '@renderer/utils/inputClasses'
import { CATEGORIEEN, INVOERWIJZEN } from '@shared/constants'
import type { TransactieInput, TransactieUpdate } from '@shared/schemas'
import type { BtwTarief } from '@shared/types'

import { TransactieFormSchema, type TransactieFormValues } from '../transactieFormSchema'
import { buildEmptyForm, transactieToFormValues, type FormState } from '../types'
import { TransactieTypeToggle } from './TransactieTypeToggle'

interface Props {
  mode: Exclude<FormState, { mode: 'closed' }>
  tarieven: BtwTarief[]
  onSuccess: (action: 'created' | 'updated') => void
  onCancel: () => void
}

export function TransactieForm({ mode, tarieven, onSuccess, onCancel }: Props) {
  const isEdit = mode.mode === 'edit'
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitted }
  } = useForm<TransactieFormValues>({
    resolver: zodResolver(TransactieFormSchema),
    defaultValues:
      mode.mode === 'edit' ? transactieToFormValues(mode.transactie) : buildEmptyForm(tarieven),
    mode: 'onBlur'
  })

  const onSubmit = async (values: TransactieFormValues): Promise<void> => {
    const tariefId = parseInt(values.btwTariefId, 10)
    const tarief = tarieven.find((t) => t.id === tariefId)
    if (!tarief) {
      toast.error('Geen BTW-tarief geselecteerd')
      return
    }

    const baseInput = {
      type: values.type,
      omschrijving: values.omschrijving.trim(),
      bedrag: parseFloat(values.bedrag),
      invoerwijze: values.invoerwijze,
      btwTariefId: tariefId,
      btwPercentage: tarief.percentage,
      datum: values.datum,
      categorie: values.categorie.trim() || undefined
    }

    try {
      if (mode.mode === 'edit') {
        const update: TransactieUpdate = { ...baseInput, id: mode.transactie.id }
        await transactiesApi.update(update)
        toast.success('Transactie bijgewerkt')
        onSuccess('updated')
      } else {
        const input: TransactieInput = baseInput
        await transactiesApi.create(input)
        toast.success('Transactie toegevoegd')

        // Rapid-entry: behoud type/datum/btw/invoerwijze, leeg de inhoud
        reset({
          ...values,
          omschrijving: '',
          bedrag: '',
          categorie: ''
        })

        onSuccess('created')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  const onInvalid = (): void => {
    toast.error('Controleer de gemarkeerde velden')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          {isEdit ? 'Transactie bewerken' : 'Nieuwe transactie'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Annuleren
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <TransactieTypeToggle value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {/* Datum */}
        <div>
          <label htmlFor="t-datum" className="block text-sm font-medium text-gray-600 mb-1">
            Datum
          </label>
          <input
            id="t-datum"
            type="date"
            {...register('datum')}
            className={inputClasses(!!errors.datum)}
            aria-invalid={!!errors.datum}
          />
          <FormError message={errors.datum?.message} />
        </div>

        {/* Omschrijving */}
        <div className="md:col-span-2">
          <label htmlFor="t-omschrijving" className="block text-sm font-medium text-gray-600 mb-1">
            Omschrijving
          </label>
          <input
            id="t-omschrijving"
            type="text"
            placeholder="Bijv. Installatie warmtepomp fam. De Vries"
            {...register('omschrijving')}
            className={inputClasses(!!errors.omschrijving)}
            aria-invalid={!!errors.omschrijving}
          />
          <FormError message={errors.omschrijving?.message} />
        </div>

        {/* Bedrag */}
        <div>
          <label htmlFor="t-bedrag" className="block text-sm font-medium text-gray-600 mb-1">
            Bedrag (€)
          </label>
          <input
            id="t-bedrag"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            {...register('bedrag')}
            className={inputClasses(!!errors.bedrag)}
            aria-invalid={!!errors.bedrag}
          />
          <FormError message={errors.bedrag?.message} />
        </div>

        {/* Invoerwijze */}
        <div>
          <label htmlFor="t-invoerwijze" className="block text-sm font-medium text-gray-600 mb-1">
            Bedrag is
          </label>
          <select
            id="t-invoerwijze"
            {...register('invoerwijze')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            {INVOERWIJZEN.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        {/* BTW-tarief */}
        <div>
          <label htmlFor="t-btw" className="block text-sm font-medium text-gray-600 mb-1">
            BTW-tarief
          </label>
          <select
            id="t-btw"
            {...register('btwTariefId')}
            className={inputClasses(!!errors.btwTariefId)}
            aria-invalid={!!errors.btwTariefId}
          >
            <option value="">-- Kies tarief --</option>
            {tarieven.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naam} ({t.percentage}%)
              </option>
            ))}
          </select>
          <FormError message={errors.btwTariefId?.message} />
        </div>

        {/* Categorie */}
        <div>
          <label htmlFor="t-categorie" className="block text-sm font-medium text-gray-600 mb-1">
            Categorie
          </label>
          <select
            id="t-categorie"
            {...register('categorie')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">-- Geen --</option>
            {CATEGORIEEN.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FormError message={errors.categorie?.message} />
        </div>
      </div>

      {isSubmitted && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Er zijn nog fouten in het formulier. Controleer de gemarkeerde velden.
        </div>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          <>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Bezig...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                {isEdit ? 'Opslaan' : 'Toevoegen'}
              </>
            )}
          </>
        </button>
      </div>
    </form>
  )
}
