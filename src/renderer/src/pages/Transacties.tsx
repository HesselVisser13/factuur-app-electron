// src/renderer/src/pages/Transacties.tsx

import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { TransactieForm } from '../components/TransactieForm'
import { formatBedrag, formatDatumKort } from '../utils/formatters'
import type { Transactie, BtwTarief } from '../../../shared/types'

export function Transacties() {
  const currentYear = new Date().getFullYear()
  const [van, setVan] = useState(`${currentYear}-01-01`)
  const [tot, setTot] = useState(`${currentYear}-12-31`)
  const [showForm, setShowForm] = useState(false)

  const {
    data: transacties,
    loading,
    error,
    refetch
  } = useApi<Transactie[]>(() => window.api.getTransacties(van, tot), [van, tot])

  async function handleDelete(id: number) {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) {
      return
    }
    try {
      await window.api.deleteTransactie(id)
      refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt')
    }
  }

  function handleCreated() {
    setShowForm(false)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💶 Transacties</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          {showForm ? 'Annuleren' : '+ Nieuwe transactie'}
        </button>
      </div>

      {showForm && <TransactieForm onSuccess={handleCreated} />}

      {/* Periode filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Van</label>
          <input
            type="date"
            value={van}
            onChange={(e) => setVan(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Tot</label>
          <input
            type="date"
            value={tot}
            onChange={(e) => setTot(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Transacties */}
      {loading && <div className="text-center py-12 text-gray-500">Laden...</div>}

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && transacties && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                  Datum
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                  Omschrijving
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                  Bedrag excl.
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                  BTW
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                  Bedrag incl.
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transacties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Geen transacties in deze periode
                  </td>
                </tr>
              ) : (
                transacties.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDatumKort(new Date(t.datum))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${t.type === 'inkomst' ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      {t.omschrijving}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{formatBedrag(t.bedragExcl)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatBedrag(t.btwBedrag)} ({t.btwPercentage}%)
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatBedrag(t.bedragIncl)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
