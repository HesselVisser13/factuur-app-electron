// src/renderer/src/components/TransactieForm.tsx

import { useState } from 'react'
import type { BtwTarief } from '../../../shared/types'
import type { TransactieInput } from '../../../shared/schemas'
import { transactiesApi } from '../api'
import { TRANSACTIE_TYPES, CATEGORIEEN, INVOERWIJZEN } from '../../../shared/constants'

interface Props {
  tarieven: BtwTarief[]
  onSuccess: () => void
}

export function TransactieForm({ tarieven, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: 'inkomst' as 'inkomst' | 'uitgave',
    omschrijving: '',
    bedrag: '',
    invoerwijze: 'exclusief' as 'exclusief' | 'inclusief',
    btwTariefId: tarieven[0]?.id ? String(tarieven[0].id) : '',
    datum: new Date().toISOString().split('T')[0],
    categorie: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const tarief = tarieven.find((t) => t.id === parseInt(form.btwTariefId))
      if (!tarief) throw new Error('Geen BTW-tarief geselecteerd')

      const input: TransactieInput = {
        type: form.type,
        omschrijving: form.omschrijving,
        bedrag: parseFloat(form.bedrag),
        invoerwijze: form.invoerwijze,
        btwTariefId: parseInt(form.btwTariefId),
        btwPercentage: tarief.percentage,
        datum: form.datum,
        categorie: form.categorie || undefined
      }

      await transactiesApi.create(input)

      setForm({
        ...form,
        omschrijving: '',
        bedrag: '',
        categorie: ''
      })

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
        Nieuwe transactie
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <div className="flex gap-2">
            {TRANSACTIE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
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

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Datum</label>
          <input
            type="date"
            value={form.datum}
            onChange={(e) => setForm({ ...form, datum: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Omschrijving</label>
          <input
            type="text"
            value={form.omschrijving}
            onChange={(e) => setForm({ ...form, omschrijving: e.target.value })}
            placeholder="Bijv. Installatie warmtepomp fam. De Vries"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Bedrag (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.bedrag}
            onChange={(e) => setForm({ ...form, bedrag: e.target.value })}
            placeholder="0,00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Bedrag is</label>
          <select
            value={form.invoerwijze}
            onChange={(e) =>
              setForm({
                ...form,
                invoerwijze: e.target.value as 'exclusief' | 'inclusief'
              })
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

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">BTW-tarief</label>
          <select
            value={form.btwTariefId}
            onChange={(e) => setForm({ ...form, btwTariefId: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            {tarieven.map((t) => (
              <option key={t.id} value={t.id}>
                {t.naam} ({t.percentage}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Categorie</label>
          <select
            value={form.categorie}
            onChange={(e) => setForm({ ...form, categorie: e.target.value })}
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

      <div className="mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Bezig...' : '✓ Toevoegen'}
        </button>
      </div>
    </form>
  )
}
