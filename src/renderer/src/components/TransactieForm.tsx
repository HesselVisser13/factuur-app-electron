// src/renderer/src/components/TransactieForm.tsx

import { useState } from 'react'
import type { BtwTarief, Transactie } from '../../../shared/types'
import type { TransactieInput, TransactieUpdate } from '../../../shared/schemas'
import { transactiesApi } from '../api'
import { TRANSACTIE_TYPES, CATEGORIEEN, INVOERWIJZEN } from '../../../shared/constants'
import { useToast } from './Toast'
import { validateRequired, validateMaxLength } from '../utils/validators'

interface Props {
  tarieven: BtwTarief[]
  transactie?: Transactie
  onSuccess: () => void
  onCancel?: () => void
}

type FormState = {
  type: 'inkomst' | 'uitgave'
  omschrijving: string
  bedrag: string
  invoerwijze: 'exclusief' | 'inclusief'
  btwTariefId: string
  datum: string
  categorie: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

// ============================================================
// Validatie
// ============================================================

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  // Omschrijving: verplicht + max 500
  errors.omschrijving =
    validateRequired(form.omschrijving, 'Omschrijving') ??
    validateMaxLength(form.omschrijving, 500, 'Omschrijving') ??
    undefined

  // Bedrag: verplicht, getal, > 0, max 1.000.000
  if (!form.bedrag || !form.bedrag.trim()) {
    errors.bedrag = 'Bedrag is verplicht'
  } else {
    const bedrag = parseFloat(form.bedrag)
    if (isNaN(bedrag)) {
      errors.bedrag = 'Bedrag moet een getal zijn'
    } else if (bedrag <= 0) {
      errors.bedrag = 'Bedrag moet groter zijn dan 0'
    } else if (bedrag > 1_000_000) {
      errors.bedrag = 'Bedrag te hoog (max €1.000.000)'
    }
  }

  // Datum: verplicht + format check
  if (!form.datum) {
    errors.datum = 'Datum is verplicht'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.datum)) {
    errors.datum = 'Ongeldige datum'
  } else if (isNaN(new Date(form.datum).getTime())) {
    errors.datum = 'Ongeldige datum'
  }

  // BTW-tarief: verplicht
  if (!form.btwTariefId) {
    errors.btwTariefId = 'Kies een BTW-tarief'
  }

  // Categorie & notitie alleen max-length checks (zijn optioneel)
  if (form.categorie) {
    const err = validateMaxLength(form.categorie, 100, 'Categorie')
    if (err) errors.categorie = err
  }

  // Verwijder undefined-waardes
  Object.keys(errors).forEach((key) => {
    if (errors[key as keyof FormErrors] === undefined) {
      delete errors[key as keyof FormErrors]
    }
  })

  return errors
}

// ============================================================
// Component
// ============================================================

export function TransactieForm({ tarieven, transactie, onSuccess, onCancel }: Props) {
  const isEdit = !!transactie
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const [form, setForm] = useState<FormState>({
    type: transactie?.type || 'inkomst',
    omschrijving: transactie?.omschrijving || '',
    bedrag: transactie ? String(transactie.bedrag) : '',
    invoerwijze: transactie?.invoerwijze || 'exclusief',
    btwTariefId: String(transactie?.btwTariefId || tarieven[0]?.id || ''),
    datum: transactie
      ? new Date(transactie.datum).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    categorie: transactie?.categorie || ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    const newForm = { ...form, [key]: value }
    setForm(newForm)
    // Altijd revalideren — fouten alleen tonen bij touched velden
    setErrors(validateForm(newForm))
  }

  function handleBlur(key: keyof FormState) {
    setTouched({ ...touched, [key]: true })
    setErrors(validateForm(form))
  }

  function inputClasses(field: keyof FormState): string {
    const base = 'w-full border rounded-lg px-4 py-2 text-sm'
    const hasError = touched[field] && errors[field]
    return `${base} ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`
  }

  function errorMessage(field: keyof FormState) {
    const hasError = touched[field] && errors[field]
    if (!hasError) return null
    return <p className="text-xs text-red-600 mt-1">{errors[field]}</p>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Markeer alles als touched bij submit zodat verborgen fouten zichtbaar worden
    const formErrors = validateForm(form)
    setErrors(formErrors)
    setTouched(Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    if (Object.keys(formErrors).length > 0) {
      toast.error('Controleer de gemarkeerde velden')
      return
    }

    setSubmitting(true)
    try {
      const tarief = tarieven.find((t) => t.id === parseInt(form.btwTariefId))
      if (!tarief) throw new Error('Geen BTW-tarief geselecteerd')

      const baseInput = {
        type: form.type,
        omschrijving: form.omschrijving.trim(),
        bedrag: parseFloat(form.bedrag),
        invoerwijze: form.invoerwijze,
        btwTariefId: parseInt(form.btwTariefId),
        btwPercentage: tarief.percentage,
        datum: form.datum,
        categorie: form.categorie || undefined
      }

      if (isEdit && transactie) {
        const input: TransactieUpdate = { ...baseInput, id: transactie.id }
        await transactiesApi.update(input)
        toast.success('Transactie bijgewerkt')
      } else {
        const input: TransactieInput = baseInput
        await transactiesApi.create(input)
        toast.success('Transactie toegevoegd')

        // Reset alleen de "data"-velden, behoud type/datum/btw voor snelle invoer meerdere transacties
        setForm({
          ...form,
          omschrijving: '',
          bedrag: '',
          categorie: ''
        })
        setErrors({})
        setTouched({})
      }

      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setSubmitting(false)
    }
  }

  // Banner alleen tonen als er ZICHTBARE fouten zijn (touched velden met errors)
  const heeftZichtbareErrors = Object.keys(errors).some((key) => touched[key as keyof FormState])

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          {isEdit ? 'Transactie bewerken' : 'Nieuwe transactie'}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Annuleren
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <div className="flex gap-2">
            {TRANSACTIE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => updateField('type', t.value)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === t.value
                    ? t.color === 'green'
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datum */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Datum</label>
          <input
            type="date"
            value={form.datum}
            onChange={(e) => updateField('datum', e.target.value)}
            onBlur={() => handleBlur('datum')}
            className={inputClasses('datum')}
          />
          {errorMessage('datum')}
        </div>

        {/* Omschrijving */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Omschrijving</label>
          <input
            type="text"
            value={form.omschrijving}
            onChange={(e) => updateField('omschrijving', e.target.value)}
            onBlur={() => handleBlur('omschrijving')}
            placeholder="Bijv. Installatie warmtepomp fam. De Vries"
            className={inputClasses('omschrijving')}
          />
          {errorMessage('omschrijving')}
        </div>

        {/* Bedrag */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Bedrag (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.bedrag}
            onChange={(e) => updateField('bedrag', e.target.value)}
            onBlur={() => handleBlur('bedrag')}
            placeholder="0,00"
            className={inputClasses('bedrag')}
          />
          {errorMessage('bedrag')}
        </div>

        {/* Invoerwijze */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Bedrag is</label>
          <select
            value={form.invoerwijze}
            onChange={(e) =>
              updateField('invoerwijze', e.target.value as 'exclusief' | 'inclusief')
            }
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
          <label className="block text-sm font-medium text-gray-600 mb-1">BTW-tarief</label>
          <select
            value={form.btwTariefId}
            onChange={(e) => updateField('btwTariefId', e.target.value)}
            onBlur={() => handleBlur('btwTariefId')}
            className={inputClasses('btwTariefId')}
          >
            <option value="">-- Kies tarief --</option>
            {tarieven.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naam} ({t.percentage}%)
              </option>
            ))}
          </select>
          {errorMessage('btwTariefId')}
        </div>

        {/* Categorie */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Categorie</label>
          <select
            value={form.categorie}
            onChange={(e) => updateField('categorie', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">-- Geen --</option>
            {CATEGORIEEN.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Algemene foutmelding bij submit */}
      {heeftZichtbareErrors && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ⚠️ Er zijn nog fouten in het formulier. Controleer de gemarkeerde velden.
        </div>
      )}

      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Bezig...' : isEdit ? '✓ Opslaan' : '✓ Toevoegen'}
        </button>
      </div>
    </form>
  )
}
