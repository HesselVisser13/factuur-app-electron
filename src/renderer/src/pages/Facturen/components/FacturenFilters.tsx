//src/renderer/src/pages/Facturen/components/FacturenFilters.tsx

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
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="search"
        placeholder="Zoek op factuurnummer, klant of referentie..."
        value={zoek}
        onChange={(e) => onZoekChange(e.target.value)}
        aria-label="Zoek facturen"
        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
      />
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        aria-label="Filter op status"
        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
      >
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
