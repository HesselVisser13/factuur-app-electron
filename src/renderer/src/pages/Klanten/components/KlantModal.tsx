//src/renderer/src/pages/Klanten/components/KlantModal.tsx

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import FocusLock from 'react-focus-lock'
import { Controller, useForm } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'

import { klantenApi } from '@renderer/api/klanten'
import { FormError } from '@renderer/components/FormError'
import { useToast } from '@renderer/components/Toast'
import { inputClasses } from '@renderer/utils/inputClasses'
import type { KlantInput, KlantUpdate } from '@shared/schemas'
import type { Klant } from '@shared/types'

import { KlantFormSchema, type KlantFormOutput, type KlantFormValues } from '../klantFormSchema'
import { emptyKlantForm, klantToFormValues } from '../types'
import { KlantTypeToggle } from './KlantTypeToggle'

interface Props {
  klant: Klant | null
  onClose: () => void
  onSaved: () => Promise<void> | void
}

export function KlantModal({ klant, onClose, onSaved }: Props) {
  const toast = useToast()
  const editId = klant?.id ?? null

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isSubmitted }
  } = useForm<KlantFormValues, unknown, KlantFormOutput>({
    resolver: zodResolver(KlantFormSchema),
    defaultValues: klant ? klantToFormValues(klant) : emptyKlantForm,
    mode: 'onBlur'
  })

  // Escape sluit modal
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Body-scroll vergrendelen
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  const type = watch('type')
  const isZakelijk = type === 'zakelijk'

  const onSubmit = async (values: KlantFormOutput): Promise<void> => {
    try {
      const input = formValuesToKlantInput(values)

      if (editId !== null) {
        const update: KlantUpdate = { ...input, id: editId }
        await klantenApi.update(update)
        toast.success('Klant bijgewerkt')
      } else {
        await klantenApi.create(input)
        toast.success('Klant aangemaakt')
      }
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  const onInvalid = (): void => {
    toast.error('Controleer de gemarkeerde velden')
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="klant-modal-title"
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="p-6 space-y-4">
            <h2 id="klant-modal-title" className="text-xl font-bold">
              {editId !== null ? 'Klant bewerken' : 'Nieuwe klant'}
            </h2>

            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <KlantTypeToggle value={field.value} onChange={field.onChange} />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isZakelijk && (
                <Field label="Bedrijfsnaam *" error={errors.bedrijfsnaam?.message} colSpan="full">
                  <input
                    type="text"
                    {...register('bedrijfsnaam')}
                    className={inputClasses(!!errors.bedrijfsnaam)}
                    aria-invalid={!!errors.bedrijfsnaam}
                  />
                </Field>
              )}

              <Field label="Aanhef">
                <select
                  {...register('aanhef')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="">-</option>
                  <option value="Dhr.">Dhr.</option>
                  <option value="Mevr.">Mevr.</option>
                </select>
              </Field>

              <div className="hidden md:block" />

              <Field label="Voornaam" error={errors.voornaam?.message}>
                <input
                  type="text"
                  {...register('voornaam')}
                  className={inputClasses(!!errors.voornaam)}
                  aria-invalid={!!errors.voornaam}
                />
              </Field>

              <Field
                label={`Achternaam${!isZakelijk ? ' *' : ''}`}
                error={errors.achternaam?.message}
              >
                <input
                  type="text"
                  {...register('achternaam')}
                  className={inputClasses(!!errors.achternaam)}
                  aria-invalid={!!errors.achternaam}
                />
              </Field>

              <Field label="Adres" error={errors.adres?.message} colSpan="full">
                <input
                  type="text"
                  placeholder="Straatnaam 1"
                  {...register('adres')}
                  className={inputClasses(!!errors.adres)}
                  aria-invalid={!!errors.adres}
                />
              </Field>

              <Field label="Postcode" error={errors.postcode?.message}>
                <input
                  type="text"
                  placeholder="1234 AB"
                  {...register('postcode')}
                  className={inputClasses(!!errors.postcode)}
                  aria-invalid={!!errors.postcode}
                />
              </Field>

              <Field label="Plaats" error={errors.plaats?.message}>
                <input
                  type="text"
                  {...register('plaats')}
                  className={inputClasses(!!errors.plaats)}
                  aria-invalid={!!errors.plaats}
                />
              </Field>

              <Field label="E-mail" error={errors.email?.message}>
                <input
                  type="email"
                  placeholder="naam@voorbeeld.nl"
                  {...register('email')}
                  className={inputClasses(!!errors.email)}
                  aria-invalid={!!errors.email}
                />
              </Field>

              <Field label="Telefoon" error={errors.telefoon?.message}>
                <input
                  type="tel"
                  placeholder="06-12345678"
                  {...register('telefoon')}
                  className={inputClasses(!!errors.telefoon)}
                  aria-invalid={!!errors.telefoon}
                />
              </Field>

              {isZakelijk && (
                <>
                  <Field label="KvK-nummer" error={errors.kvkNummer?.message}>
                    <input
                      type="text"
                      placeholder="12345678"
                      {...register('kvkNummer')}
                      className={inputClasses(!!errors.kvkNummer)}
                      aria-invalid={!!errors.kvkNummer}
                    />
                  </Field>

                  <Field label="BTW-nummer" error={errors.btwNummer?.message}>
                    <input
                      type="text"
                      placeholder="NL123456789B01"
                      {...register('btwNummer')}
                      className={inputClasses(!!errors.btwNummer)}
                      aria-invalid={!!errors.btwNummer}
                    />
                  </Field>
                </>
              )}
            </div>

            {/* Banner alleen na submit-poging */}
            {isSubmitted && Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                Er zijn nog fouten in het formulier. Controleer de gemarkeerde velden.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Opslaan...' : editId !== null ? 'Bijwerken' : 'Aanmaken'}
              </button>
            </div>
          </form>
        </div>
      </FocusLock>
    </div>
  )
}

// ============================================================
// Field wrapper
// ============================================================

interface FieldProps {
  label: string
  error?: string
  colSpan?: 'full'
  children: React.ReactNode
}

function Field({ label, error, colSpan, children }: FieldProps) {
  return (
    <div className={colSpan === 'full' ? 'md:col-span-2' : undefined}>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
      <FormError message={error} />
    </div>
  )
}

// ============================================================
// Form values → KlantInput (zonder unsafe cast)
// ============================================================

function formValuesToKlantInput(values: KlantFormOutput): KlantInput {
  const optional = (v: string): string | undefined => (v.trim() === '' ? undefined : v.trim())

  if (values.type === 'zakelijk') {
    return {
      type: 'zakelijk',
      bedrijfsnaam: values.bedrijfsnaam.trim(),
      aanhef: optional(values.aanhef),
      voornaam: optional(values.voornaam),
      achternaam: optional(values.achternaam),
      adres: optional(values.adres),
      postcode: optional(values.postcode),
      plaats: optional(values.plaats),
      email: optional(values.email),
      telefoon: optional(values.telefoon),
      kvkNummer: optional(values.kvkNummer),
      btwNummer: optional(values.btwNummer)
    }
  }

  return {
    type: 'particulier',
    achternaam: values.achternaam.trim(),
    aanhef: optional(values.aanhef),
    voornaam: optional(values.voornaam),
    adres: optional(values.adres),
    postcode: optional(values.postcode),
    plaats: optional(values.plaats),
    email: optional(values.email),
    telefoon: optional(values.telefoon),
    bedrijfsnaam: optional(values.bedrijfsnaam),
    kvkNummer: optional(values.kvkNummer),
    btwNummer: optional(values.btwNummer)
  }
}
