// src/renderer/src/pages/Offertes/components/OffertesTabel.tsx

import { AlertTriangle, ClipboardList } from 'lucide-react'

import {
  DocumentTabel,
  type DocumentAdapter,
  type DocumentEmptyState,
  type ExtraColumn
} from '@renderer/components/document-list'
import { formatDate } from '@renderer/utils/formatters'
import type { OfferteStatus } from '@shared/schemas'
import type { Offerte } from '@shared/types'

import { OFFERTE_STATUS_CONFIG } from '../offerteStatusConfig'

import { OfferteActieMenu } from './OfferteActieMenu'

interface Props {
  offertes: Offerte[]
  totalCount: number
  loading: boolean
  pendingStatusId: number | null
  deletingId: number | null
  convertingId: number | null
  onEdit: (o: Offerte) => void
  onStatusChange: (o: Offerte, status: OfferteStatus) => void
  onDelete: (o: Offerte) => void
  onConverteer: (o: Offerte) => void
  onViewFactuur: (o: Offerte) => void
  onPdfOpen: (o: Offerte) => void
  onPdfSaveAs: (o: Offerte) => void
  onAddNew?: () => void
  onPdfPreview: (o: Offerte) => void
  onMail: (o: Offerte) => void
}

const OFFERTE_ADAPTER: DocumentAdapter<Offerte, OfferteStatus> = {
  getKey: (o) => o.id,
  getNummer: (o) => o.offerteNummer,
  getDatum: (o) => o.datum,
  getKlant: (o) => o.klant,
  getStatus: (o) => o.status,
  getTotaal: (o) => o.totaalIncl
}

const EMPTY_STATE: DocumentEmptyState = {
  icon: ClipboardList,
  title: 'Nog geen offertes',
  description:
    "Maak je eerste offerte aan voor een klant. Bij akkoord kun je 'm met één klik omzetten naar een factuur.",
  actionLabel: 'Eerste offerte maken',
  noResultsText: 'Geen offertes gevonden met deze filters.'
}

function isVerlopen(o: Offerte): boolean {
  if (o.status !== 'verzonden') return false
  return new Date(o.geldigTot) < new Date()
}

export function OffertesTabel({
  offertes,
  totalCount,
  loading,
  pendingStatusId,
  deletingId,
  convertingId,
  onEdit,
  onStatusChange,
  onDelete,
  onConverteer,
  onViewFactuur,
  onPdfOpen,
  onPdfSaveAs,
  onAddNew,
  onPdfPreview,
  onMail
}: Props) {
  const busyIds = new Set<number>()
  if (pendingStatusId !== null) busyIds.add(pendingStatusId)
  if (deletingId !== null) busyIds.add(deletingId)
  if (convertingId !== null) busyIds.add(convertingId)

  const renderBadges = (o: Offerte) =>
    isVerlopen(o) ? (
      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 inline-flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        Verlopen
      </span>
    ) : null

  const renderActions = (o: Offerte) => (
    <OfferteActieMenu
      offerte={o}
      busy={busyIds.has(o.id)}
      onEdit={() => onEdit(o)}
      onStatusChange={(status) => onStatusChange(o, status)}
      onDelete={() => onDelete(o)}
      onConverteer={() => onConverteer(o)}
      onViewFactuur={() => onViewFactuur(o)}
      onPdfOpen={() => onPdfOpen(o)}
      onPdfSaveAs={() => onPdfSaveAs(o)}
      onPdfPreview={() => onPdfPreview(o)}
      onMail={() => onMail(o)}
    />
  )

  const extraColumns: ExtraColumn<Offerte>[] = [
    {
      key: 'type',
      header: 'Type',
      align: 'left',
      render: (o) => (
        <span className="text-gray-500 text-sm">{o.isPrijsopgave ? 'Prijsopgave' : 'Offerte'}</span>
      )
    },
    {
      key: 'geldigTot',
      header: 'Geldig tot',
      align: 'left',
      render: (o) => formatDate(o.geldigTot)
    }
  ]

  return (
    <DocumentTabel<Offerte, OfferteStatus>
      items={offertes}
      totalCount={totalCount}
      loading={loading}
      busyIds={busyIds}
      adapter={OFFERTE_ADAPTER}
      statusConfig={OFFERTE_STATUS_CONFIG}
      extraColumns={extraColumns}
      renderBadges={renderBadges}
      renderActions={renderActions}
      emptyState={EMPTY_STATE}
      onAddNew={onAddNew}
    />
  )
}
