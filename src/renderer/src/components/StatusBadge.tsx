// src/renderer/src/components/StatusBadge.tsx

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileEdit,
  HelpCircle,
  Send,
  type LucideIcon
} from 'lucide-react'

export type FactuurStatus = 'concept' | 'verstuurd' | 'betaald' | 'geannuleerd'

interface StatusConfig {
  label: string
  classes: string
  icon: LucideIcon
}

const STATUS_CONFIG: Record<FactuurStatus, StatusConfig> = {
  concept: { label: 'Concept', classes: 'bg-gray-100 text-gray-700', icon: FileEdit },
  verstuurd: { label: 'Verstuurd', classes: 'bg-blue-100 text-blue-700', icon: Send },
  betaald: { label: 'Betaald', classes: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  geannuleerd: { label: 'Geannuleerd', classes: 'bg-red-100 text-red-700', icon: Ban }
}

const FALLBACK: StatusConfig = {
  label: 'Onbekend',
  classes: 'bg-gray-100 text-gray-700',
  icon: HelpCircle
}

interface StatusBadgeProps {
  status: FactuurStatus | string
  vervallen?: boolean
}

export function StatusBadge({ status, vervallen = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as FactuurStatus] ?? FALLBACK
  const Icon = config.icon

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${config.classes}`}
      >
        <Icon className="w-3 h-3" aria-hidden="true" />
        {config.label}
      </span>
      {vervallen && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
          Vervallen
        </span>
      )}
    </span>
  )
}
