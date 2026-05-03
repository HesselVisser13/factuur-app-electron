// src/renderer/src/pages/Transacties.tsx

import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { TransactieForm } from '../components/TransactieForm'
import { formatCurrency, formatDate } from '../utils/formatters'
import { transactiesApi, btwTarievenApi } from '../api'
import type { Transactie, BtwTarief } from '../../../shared/types'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'

export function Transacties() {
  const currentYear = new Date().getFullYear()
  const [van, setVan] = useState(`${currentYear}-01-01`)
  const [tot, setTot] = useState(`${currentYear}-12-31`)
  const [showForm, setShowForm] = useState(false)
  const [editTransactie, setEditTransactie] = useState<Transactie | null>(null)
  const toast = useToast()
  const confirm = useConfirm()

  const {
    data: transacties,
    loading,
    error,
    refetch
  } = useApi<Transactie[]>(() => transactiesApi.list(van, tot), [van, tot])

  const { data: tarieven } = useApi<BtwTarief[]>(() => btwTarievenApi.getActief(), [])

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: 'Transactie verwijderen',
      message: 'Weet je zeker dat je deze transactie wilt verwijderen?',
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return
    try {
      await transactiesApi.delete(id)
      toast.success('Transactie verwijderd')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt')
    }
  }

  function handleCreated() {
    setShowForm(false)
    setEditTransactie(null)
    refetch()
  }

  function handleEdit(t: Transactie) {
    setEditTransactie(t)
    setShowForm(false)
  }

  function handleCancelEdit() {
    setEditTransactie(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💶 Transacties</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditTransactie(null)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          {showForm ? 'Annuleren' : '+ Nieuwe transactie'}
        </button>
      </div>

      {showForm && tarieven && <TransactieForm tarieven={tarieven} onSuccess={handleCreated} />}

      {editTransactie && tarieven && (
        <TransactieForm
          tarieven={tarieven}
          transactie={editTransactie}
          onSuccess={handleCreated}
          onCancel={handleCancelEdit}
        />
      )}

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
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(t.datum)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          t.type === 'inkomst' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      {t.omschrijving}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(t.bedragExcl)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(t.btwBedrag)} ({t.btwPercentage}%)
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(t.bedragIncl)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                        title="Bewerken"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Verwijderen"
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
