// src/renderer/src/components/document-list/DocumentTabel.tsx

import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@renderer/components/EmptyState'
import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import { klantDisplayNaam } from '@shared/klant-utils'

import type { DocumentAdapter, DocumentEmptyState, DocumentStatusInfo, ExtraColumn } from './types'

interface Props<T, S extends string> {
  items: T[]
  totalCount: number
  loading: boolean
  busyIds: Set<number>

  /** Adapter om generic items om te zetten naar tabel-velden */
  adapter: DocumentAdapter<T, S>

  /** Status-config map: status → visuele info */
  statusConfig: Record<S, DocumentStatusInfo>

  /** Optionele extra kolommen tussen klant en status */
  extraColumns?: ExtraColumn<T>[]

  /** Optionele extra badges naast status (bv. "Vervallen" / "Verlopen") */
  renderBadges?: (item: T) => ReactNode

  /** Hoe de actie-cel renderen — verschillend per type */
  renderActions: (item: T) => ReactNode

  /** Empty-state config */
  emptyState: DocumentEmptyState

  /** Optional: maak nieuwe item bij eerste-keer-empty */
  onAddNew?: () => void

  /** Label voor de bedrag-kolom */
  bedragLabel?: string
}

export function DocumentTabel<T, S extends string>({
  items,
  totalCount,
  loading,
  busyIds,
  adapter,
  statusConfig,
  extraColumns,
  renderBadges,
  renderActions,
  emptyState,
  onAddNew,
  bedragLabel = 'Bedrag'
}: Props<T, S>) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        Laden...
      </div>
    )
  }

  if (items.length === 0) {
    if (totalCount === 0 && onAddNew) {
      return (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={{
            label: emptyState.actionLabel,
            onClick: onAddNew,
            icon: Plus
          }}
        />
      )
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        {emptyState.noResultsText}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th scope="col" className="text-left px-4 py-3">
              Nummer
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Datum
            </th>
            {extraColumns?.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
            <th scope="col" className="text-left px-4 py-3">
              Klant
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Status
            </th>
            <th scope="col" className="text-right px-4 py-3">
              {bedragLabel}
            </th>
            <th scope="col" className="text-right px-4 py-3">
              <span className="sr-only">Acties</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const id = adapter.getKey(item)
            const status = statusConfig[adapter.getStatus(item)]
            const busy = busyIds.has(id)

            return (
              <tr
                key={id}
                className={`border-t border-gray-100 hover:bg-gray-50 ${busy ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3 font-medium font-mono">{adapter.getNummer(item)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(adapter.getDatum(item))}</td>
                {extraColumns?.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-gray-600'}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
                <td className="px-4 py-3">{klantDisplayNaam(adapter.getKlant(item))}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.classes} inline-flex items-center gap-1`}
                  >
                    <status.icon className="w-3 h-3" aria-hidden="true" />
                    {status.label}
                  </span>
                  {renderBadges?.(item)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(adapter.getTotaal(item))}
                </td>
                <td className="px-4 py-3 text-right">{renderActions(item)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
