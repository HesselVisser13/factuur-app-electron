// src/renderer/src/pages/Facturen/components/FacturenTabel.tsx

import { AlertTriangle, FileText } from 'lucide-react'

import {
  DocumentTabel,
  type DocumentAdapter,
  type DocumentEmptyState,
  type ExtraColumn
} from '@renderer/components/document-list'
import type { FactuurStatus } from '@shared/schemas'
import type { Factuur } from '@shared/types'

import { STATUS_CONFIG } from '../statusConfig'

import { FactuurActieMenu } from './FactuurActieMenu'

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

const FACTUUR_ADAPTER: DocumentAdapter<Factuur, FactuurStatus> = {
  getKey: (f) => f.id,
  getNummer: (f) => f.factuurNummer,
  getDatum: (f) => f.datum,
  getKlant: (f) => f.klant,
  getStatus: (f) => f.status,
  getTotaal: (f) => f.totaalIncl
}

const EMPTY_STATE: DocumentEmptyState = {
  icon: FileText,
  title: 'Nog geen facturen',
  description:
    'Maak je eerste factuur aan voor een klant. Vul regels in, voeg eventueel reistijd toe, en verstuur de PDF direct naar je klant.',
  actionLabel: 'Eerste factuur maken',
  noResultsText: 'Geen facturen gevonden met deze filters.'
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
  const busyIds = new Set<number>()
  if (pendingStatusId !== null) busyIds.add(pendingStatusId)
  if (deletingId !== null) busyIds.add(deletingId)

  const renderBadges = (f: Factuur) =>
    isVervallen(f) ? (
      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 inline-flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        Vervallen
      </span>
    ) : null

  const renderActions = (f: Factuur) => (
    <FactuurActieMenu
      factuur={f}
      busy={busyIds.has(f.id)}
      onEdit={() => onEdit(f)}
      onStatusChange={(status) => onStatusChange(f, status)}
      onDelete={() => onDelete(f)}
      onPdfOpen={() => onPdfOpen(f)}
      onPdfSaveAs={() => onPdfSaveAs(f)}
      onPdfPreview={() => onPdfPreview(f)}
      onMail={() => onMail(f)}
      onShowMailHistory={() => onShowMailHistory(f)}
    />
  )

  // Geen extra kolommen voor Facturen
  const extraColumns: ExtraColumn<Factuur>[] = []

  return (
    <DocumentTabel<Factuur, FactuurStatus>
      items={facturen}
      totalCount={totalCount}
      loading={loading}
      busyIds={busyIds}
      adapter={FACTUUR_ADAPTER}
      statusConfig={STATUS_CONFIG}
      extraColumns={extraColumns}
      renderBadges={renderBadges}
      renderActions={renderActions}
      emptyState={EMPTY_STATE}
      onAddNew={onAddNew}
    />
  )
}
