//src/renderer/src/pages/Facturen/statusConfig.ts

import type { FactuurStatus } from '@shared/schemas'

export interface StatusInfo {
  label: string
  classes: string
  icon: string
}

export const STATUS_CONFIG: Record<FactuurStatus, StatusInfo> = {
  concept: { label: 'Concept', classes: 'bg-gray-100 text-gray-700', icon: '📝' },
  verstuurd: { label: 'Verstuurd', classes: 'bg-blue-100 text-blue-700', icon: '📤' },
  betaald: { label: 'Betaald', classes: 'bg-green-100 text-green-700', icon: '✅' },
  geannuleerd: {
    label: 'Geannuleerd',
    classes: 'bg-red-100 text-red-700 line-through',
    icon: '🚫'
  }
}

export const STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: 'alle' | FactuurStatus
  label: string
}> = [
  { value: 'alle', label: 'Alle statussen' },
  { value: 'concept', label: '📝 Concepten' },
  { value: 'verstuurd', label: '📤 Verstuurd' },
  { value: 'betaald', label: '✅ Betaald' },
  { value: 'geannuleerd', label: '🚫 Geannuleerd' }
]
