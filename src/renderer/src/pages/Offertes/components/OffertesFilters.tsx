// src/renderer/src/pages/Offertes/components/OffertesFilters.tsx

import { DocumentFilters } from '@renderer/components/document-list'
import type { OfferteStatus } from '@shared/schemas'

import { OFFERTE_STATUS_FILTER_OPTIONS } from '../offerteStatusConfig'

export type OfferteStatusFilter = 'alle' | OfferteStatus

interface Props {
  zoek: string
  statusFilter: OfferteStatusFilter
  onZoekChange: (value: string) => void
  onStatusChange: (value: OfferteStatusFilter) => void
}

export function OffertesFilters({ zoek, statusFilter, onZoekChange, onStatusChange }: Props) {
  return (
    <DocumentFilters<OfferteStatus>
      zoek={zoek}
      statusFilter={statusFilter}
      options={OFFERTE_STATUS_FILTER_OPTIONS}
      zoekPlaceholder="Zoek op offertenummer, klant of referentie..."
      zoekAriaLabel="Zoek offertes"
      statusAriaLabel="Filter op status"
      onZoekChange={onZoekChange}
      onStatusChange={onStatusChange}
    />
  )
}
