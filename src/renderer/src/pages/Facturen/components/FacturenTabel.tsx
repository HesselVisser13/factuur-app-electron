//src/renderer/src/pages/Facturen/components/FacturenTabel.tsx

import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import { klantDisplayNaam } from '@shared/klant-utils'
import type { FactuurStatus } from '@shared/schemas'
import type { Factuur } from '@shared/types'
import { AlertTriangle, FileText, Plus } from 'lucide-react'

import { STATUS_CONFIG } from '../statusConfig'
import { FactuurActieMenu } from './FactuurActieMenu'
import { EmptyState } from '@renderer/components/EmptyState'

interface Props {
  facturen: Factuur[]
  totalCount: number
  loading: boolean
  pendingStatusId: number | null
  deletingId: number | null
  onEdit: (f: Factuur) => void
  onStatusChange: (f: Factuur, status: FactuurStatus) => void
  onDelete: (f: Factuur) => void
  onPdfOpen: (f: Factuur) => void
  onPdfSaveAs: (f: Factuur) => void
  onPdfPreview: (f: Factuur) => void
  onMail: (f: Factuur) => void
  onShowMailHistory: (f: Factuur) => void
  onAddNew?: () => void
}

function isVervallen(f: Factuur): boolean {
  if (f.status !== 'verstuurd') return false
  return new Date(f.vervalDatum) < new Date()
}

export function FacturenTabel({
  facturen,
  totalCount,
  loading,
  pendingStatusId,
  deletingId,
  onEdit,
  onStatusChange,
  onDelete,
  onPdfOpen,
  onPdfSaveAs,
  onPdfPreview,
  onMail,
  onShowMailHistory,
  onAddNew
}: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        Laden...
      </div>
    )
  }

  if (facturen.length === 0) {
    if (totalCount === 0 && onAddNew) {
      return (
        <EmptyState
          icon={FileText}
          title="Nog geen facturen"
          description="Maak je eerste factuur aan voor een klant. Vul regels in, voeg eventueel reistijd toe, en verstuur de PDF direct naar je klant."
          action={{
            label: 'Eerste factuur maken',
            onClick: onAddNew,
            icon: Plus
          }}
        />
      )
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        Geen facturen gevonden met deze filters.
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
            <th scope="col" className="text-left px-4 py-3">
              Klant
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Status
            </th>
            <th scope="col" className="text-right px-4 py-3">
              Bedrag
            </th>
            <th scope="col" className="text-right px-4 py-3">
              <span className="sr-only">Acties</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {facturen.map((f) => {
            const status = STATUS_CONFIG[f.status]
            const vervallen = isVervallen(f)
            const busy = pendingStatusId === f.id || deletingId === f.id

            return (
              <tr
                key={f.id}
                className={`border-t border-gray-100 hover:bg-gray-50 ${busy ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3 font-medium font-mono">{f.factuurNummer}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(f.datum)}</td>
                <td className="px-4 py-3">{klantDisplayNaam(f.klant)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.classes} inline-flex items-center gap-1`}
                  >
                    <status.icon className="w-3 h-3" aria-hidden="true" />
                    {status.label}
                  </span>
                  {vervallen && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      Vervallen
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(f.totaalIncl)}</td>
                <td className="px-4 py-3 text-right">
                  <FactuurActieMenu
                    factuur={f}
                    busy={busy}
                    onEdit={() => onEdit(f)}
                    onStatusChange={(status) => onStatusChange(f, status)}
                    onDelete={() => onDelete(f)}
                    onPdfOpen={() => onPdfOpen(f)}
                    onPdfSaveAs={() => onPdfSaveAs(f)}
                    onPdfPreview={() => onPdfPreview(f)}
                    onMail={() => onMail(f)}
                    onShowMailHistory={() => onShowMailHistory(f)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
