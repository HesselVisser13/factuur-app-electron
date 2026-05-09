// src/renderer/src/components/StatusBadge.tsx

export type FactuurStatus = 'concept' | 'verstuurd' | 'betaald' | 'geannuleerd'

interface StatusConfig {
  label: string
  classes: string
  icon: string
}

const STATUS_CONFIG: Record<FactuurStatus, StatusConfig> = {
  concept: { label: 'Concept', classes: 'bg-gray-100 text-gray-700', icon: '📝' },
  verstuurd: { label: 'Verstuurd', classes: 'bg-blue-100 text-blue-700', icon: '📤' },
  betaald: { label: 'Betaald', classes: 'bg-green-100 text-green-700', icon: '✅' },
  geannuleerd: { label: 'Geannuleerd', classes: 'bg-red-100 text-red-700', icon: '🚫' }
}

const FALLBACK: StatusConfig = {
  label: 'Onbekend',
  classes: 'bg-gray-100 text-gray-700',
  icon: '❓'
}

interface StatusBadgeProps {
  status: FactuurStatus | string
  vervallen?: boolean
}

export function StatusBadge({ status, vervallen = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as FactuurStatus] ?? FALLBACK

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.classes}`}>
        <span aria-hidden="true">{config.icon}</span> {config.label}
      </span>
      {vervallen && (
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
          <span aria-hidden="true">⚠️</span> Vervallen
        </span>
      )}
    </span>
  )
}
