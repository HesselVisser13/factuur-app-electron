// src/renderer/src/components/TransactieForm.tsx

import { useEffect, useState } from 'react'
import type { BtwTarief } from '../../../shared/types'

interface Props {
  onSuccess: () => void
}

export function TransactieForm({ onSuccess }: Props) {
  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'inkomst' as 'inkomst' | 'uitgave',
    omschrijving: '',
    bedrag: '',
    invoerwijze: 'exclusief' as 'exclusief' | 'inclusief',
    btwTariefId: '',
    datum: new Date().toISOString().split('T')[0],
    categorie: ''
  })

  useEffect(() => {
    window.api.getBtwTarieven().then((data) => {
      setTarieven(data)
      if (data.length > 0) {
        setForm((f) => ({ ...f, btwTariefId: String(data[0].id) }))
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const tarief = tarieven.find((t) => t.id === parseInt(form.btwTariefId))

    await window.api.createTransactie({
      type: form.type,
      omschrijving: form.omschrijving,
      bedrag: parseFloat(form.bedrag),
      invoerwijze: form.invoerwijze,
      btwTariefId: parseInt(form.btwTariefId),
      btwPercentage: tarief?.percentage || 0,
      datum: form.datum,
      categorie: form.categorie || undefined
    })

    setForm({
      type: 'inkomst',
      omschrijving: '',
      bedrag: '',
      invoerwijze: 'exclusief',
      btwTariefId: form.btwTariefId,
      datum: new Date().toISOString().split('T')[0],
      categorie: ''
    })

    setSubmitting(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
        Nieuwe transactie
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'inkomst' })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                form.type === 'inkomst'
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              📥 Inkomst
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'uitgave' })}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                form.type === 'uitgave'
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              📤 Uitgave
            </button>
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
              setForm({ ...form, invoerwijze: e.target.value as 'exclusief' | 'inclusief' })
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="exclusief">Exclusief BTW (ik reken door)</option>
            <option value="inclusief">Inclusief BTW (bonnetje/kassabon)</option>
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
            <option value="arbeid">👷 Arbeid</option>
            <option value="materiaal">🔩 Materiaal</option>
            <option value="transport">🚐 Transport</option>
            <option value="gereedschap">🔧 Gereedschap</option>
            <option value="overig">📦 Overig</option>
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
