// src/renderer/src/pages/Transacties/components/TransactiesTabel.tsx

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2
} from 'lucide-react'

import { EmptyState } from '@renderer/components/EmptyState'
import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import type { Transactie } from '@shared/types'

interface Props {
  transacties: Transactie[]
  deletingId: number | null
  onEdit: (t: Transactie) => void
  onDelete: (id: number) => void
  onAddNew?: () => void
}

export function TransactiesTabel({ transacties, deletingId, onEdit, onDelete, onAddNew }: Props) {
  // Empty state als er niets is
  if (transacties.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Geen transacties in deze periode"
        description="Voeg een nieuwe transactie toe (inkomst of uitgave), of pas de datumfilter aan om transacties uit een andere periode te zien."
        action={
          onAddNew
            ? {
                label: 'Nieuwe transactie',
                onClick: onAddNew,
                icon: Plus
              }
            : undefined
        }
      />
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {/* ... bestaande headers ... */}
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
          {transacties.map((t) => {
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
                  <span className="inline-flex items-center gap-2">
                    {t.type === 'inkomst' ? (
                      <ArrowUpCircle
                        className="w-4 h-4 text-green-600 shrink-0"
                        aria-label="Inkomst"
                      />
                    ) : (
                      <ArrowDownCircle
                        className="w-4 h-4 text-red-600 shrink-0"
                        aria-label="Uitgave"
                      />
                    )}
                    <span>{t.omschrijving}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(t.bedragExcl)}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatCurrency(t.btwBedrag)} ({t.btwPercentage}%)
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {formatCurrency(t.bedragIncl)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(t)}
                      disabled={isDeleting}
                      aria-label={`Bewerk transactie: ${t.omschrijving}`}
                      title="Bewerken"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      disabled={deletingId !== null}
                      aria-label={`Verwijder transactie: ${t.omschrijving}`}
                      title="Verwijderen"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
