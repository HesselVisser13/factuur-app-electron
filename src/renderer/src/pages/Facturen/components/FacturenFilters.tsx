// src/renderer/src/pages/Facturen/components/FacturenFilters.tsx

import { DocumentFilters } from '@renderer/components/document-list'
import type { FactuurStatus } from '@shared/schemas'

import { STATUS_FILTER_OPTIONS } from '../statusConfig'

export type StatusFilter = 'alle' | FactuurStatus

interface Props {
  zoek: string
  statusFilter: StatusFilter
  onZoekChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
}

export function FacturenFilters({ zoek, statusFilter, onZoekChange, onStatusChange }: Props) {
  return (
    <DocumentFilters<FactuurStatus>
      zoek={zoek}
      statusFilter={statusFilter}
      options={STATUS_FILTER_OPTIONS}
      zoekPlaceholder="Zoek op factuurnummer, klant of referentie..."
      zoekAriaLabel="Zoek facturen"
      statusAriaLabel="Filter op status"
      onZoekChange={onZoekChange}
      onStatusChange={onStatusChange}
    />
  )
}
