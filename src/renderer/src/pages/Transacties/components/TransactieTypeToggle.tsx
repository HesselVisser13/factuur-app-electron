// src/renderer/src/pages/Transacties/components/TransactieTypeToggle.tsx

import { ArrowDownCircle, ArrowUpCircle, type LucideIcon } from 'lucide-react'

import { TRANSACTIE_TYPES } from '@shared/constants'

type TransactieType = 'inkomst' | 'uitgave'

const ICONS: Record<TransactieType, LucideIcon> = {
  inkomst: ArrowUpCircle,
  uitgave: ArrowDownCircle
}

interface Props {
  value: TransactieType
  onChange: (value: TransactieType) => void
}

export function TransactieTypeToggle({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Transactietype" className="flex gap-2">
      {TRANSACTIE_TYPES.map((t) => {
        const selected = value === t.value
        const colorClasses = selected
          ? t.color === 'green'
            ? 'bg-green-100 border-green-300 text-green-700'
            : 'bg-red-100 border-red-300 text-red-700'
          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'

        const Icon = ICONS[t.value]

        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.value)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${colorClasses}`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
