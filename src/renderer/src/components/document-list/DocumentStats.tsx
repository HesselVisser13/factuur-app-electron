// src/renderer/src/components/document-list/DocumentStats.tsx

import { formatCurrency } from '@renderer/utils/formatters'

interface Props {
  aantal: number
  totaalIncl: number
  openstaand: number
  /** Label voor de "openstaand" card. Default: "Openstaand". */
  openstaandLabel?: string
}

export function DocumentStats({
  aantal,
  totaalIncl,
  openstaand,
  openstaandLabel = 'Openstaand'
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Aantal" value={String(aantal)} />
      <StatCard label="Totaal (incl. BTW)" value={formatCurrency(totaalIncl)} />
      <StatCard
        label={openstaandLabel}
        value={formatCurrency(openstaand)}
        valueClass="text-blue-600"
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass = ''
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs uppercase text-gray-500 font-bold tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</div>
    </div>
  )
}
