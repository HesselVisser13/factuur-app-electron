//src/renderer/src/pages/BtwAangifte/components/BtwAangifteTotalen.tsx

import { formatCurrency } from '@renderer/utils/formatters'

interface Props {
  verschuldigd: number
  voorbelasting: number
  afTeDragen: number
}

export function BtwAangifteTotalen({ verschuldigd, voorbelasting, afTeDragen }: Props) {
  const afTeDragenColor = afTeDragen >= 0 ? 'text-red-600' : 'text-green-600'

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <TotaalCel label="Verschuldigd" value={formatCurrency(verschuldigd)} />
        <TotaalCel label="Voorbelasting" value={formatCurrency(voorbelasting)} />
        <TotaalCel
          label={afTeDragen >= 0 ? 'Af te dragen' : 'Terug te krijgen'}
          value={formatCurrency(Math.abs(afTeDragen))}
          valueClass={afTeDragenColor}
        />
      </div>
    </div>
  )
}

interface CelProps {
  label: string
  value: string
  valueClass?: string
}

function TotaalCel({ label, value, valueClass = '' }: CelProps) {
  return (
    <div>
      <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-bold ${valueClass}`}>{value}</div>
    </div>
  )
}
