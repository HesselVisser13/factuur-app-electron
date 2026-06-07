// src/renderer/src/components/document-list/DocumentFilters.tsx

import type { DocumentStatusFilterOption } from './types'

interface Props<S extends string> {
  zoek: string
  statusFilter: 'alle' | S
  options: ReadonlyArray<DocumentStatusFilterOption<S>>
  zoekPlaceholder: string
  zoekAriaLabel: string
  statusAriaLabel: string
  onZoekChange: (value: string) => void
  onStatusChange: (value: 'alle' | S) => void
}

export function DocumentFilters<S extends string>({
  zoek,
  statusFilter,
  options,
  zoekPlaceholder,
  zoekAriaLabel,
  statusAriaLabel,
  onZoekChange,
  onStatusChange
}: Props<S>) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="search"
        placeholder={zoekPlaceholder}
        value={zoek}
        onChange={(e) => onZoekChange(e.target.value)}
        aria-label={zoekAriaLabel}
        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
      />
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as 'alle' | S)}
        aria-label={statusAriaLabel}
        className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
