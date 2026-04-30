// src/renderer/src/pages/Transacties.tsx

import { useEffect, useState } from 'react'
import { TransactieForm } from '../components/TransactieForm'
import { formatBedrag, formatDatumKort } from '../utils/formatters'
import type { Transactie } from '../../../shared/types'

export function Transacties() {
  const [transacties, setTransacties] = useState<Transactie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransacties()
  }, [])

  async function fetchTransacties() {
    const nu = new Date()
    const van = new Date(nu.getFullYear(), 0, 1).toISOString()
    const tot = new Date(nu.getFullYear(), 11, 31).toISOString()
    const data = await window.api.getTransacties(van, tot)
    setTransacties(data)
    setLoading(false)
  }

  async function handleVerwijder(id: number) {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) return
    await window.api.deleteTransactie(id)
    setTransacties(transacties.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">💶 Transacties</h1>

      <TransactieForm onSuccess={fetchTransacties} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Overzicht {new Date().getFullYear()}
        </h2>

        {loading ? (
          <p className="text-gray-400">Laden...</p>
        ) : transacties.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Nog geen transacties. Voeg er hierboven een toe.
          </p>
        ) : (
          <div className="space-y-2">
            {transacties.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{t.type === 'inkomst' ? '📥' : '📤'}</span>
                  <div>
                    <p className="font-medium text-sm">{t.omschrijving}</p>
                    <p className="text-xs text-gray-500">
                      {formatDatumKort(new Date(t.datum))} · {t.btwPercentage}% BTW
                      {t.categorie && ` · ${t.categorie}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        t.type === 'inkomst' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'inkomst' ? '+' : '-'} {formatBedrag(t.bedragExcl)}
                    </p>
                    <p className="text-xs text-gray-400">BTW: {formatBedrag(t.btwBedrag)}</p>
                  </div>
                  <button
                    onClick={() => handleVerwijder(t.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
