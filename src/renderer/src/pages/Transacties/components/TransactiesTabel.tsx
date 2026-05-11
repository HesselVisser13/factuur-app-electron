//src/renderer/src/pages/Transacties/components/TransactiesTabel.tsx

import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import type { Transactie } from '@shared/types'

interface Props {
  transacties: Transactie[]
  deletingId: number | null
  onEdit: (t: Transactie) => void
  onDelete: (id: number) => void
}

export function TransactiesTabel({ transacties, deletingId, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Datum
            </th>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Omschrijving
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Bedrag excl.
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              BTW
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Bedrag incl.
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acties</span>
            </th>
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
            transacties.map((t) => {
              const isDeleting = deletingId === t.id
              return (
                <tr
                  key={t.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isDeleting ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(t.datum)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      aria-label={t.type === 'inkomst' ? 'Inkomst' : 'Uitgave'}
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
                      type="button"
                      onClick={() => onEdit(t)}
                      disabled={isDeleting}
                      aria-label={`Bewerk transactie: ${t.omschrijving}`}
                      title="Bewerken"
                      className="text-blue-600 hover:text-blue-800 text-sm mr-3 disabled:opacity-50"
                    >
                      <span aria-hidden="true">✎</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      disabled={deletingId !== null}
                      aria-label={`Verwijder transactie: ${t.omschrijving}`}
                      title="Verwijderen"
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                    >
                      <span aria-hidden="true">{isDeleting ? '…' : '✕'}</span>
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
