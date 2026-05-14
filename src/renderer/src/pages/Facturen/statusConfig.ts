// src/renderer/src/pages/Facturen/statusConfig.ts

import { Ban, CheckCircle2, FileEdit, Send, type LucideIcon } from 'lucide-react'

import type { FactuurStatus } from '@shared/schemas'

export interface StatusInfo {
  label: string
  classes: string
  icon: LucideIcon
}

export const STATUS_CONFIG: Record<FactuurStatus, StatusInfo> = {
  concept: { label: 'Concept', classes: 'bg-gray-100 text-gray-700', icon: FileEdit },
  verstuurd: { label: 'Verstuurd', classes: 'bg-blue-100 text-blue-700', icon: Send },
  betaald: { label: 'Betaald', classes: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  geannuleerd: {
    label: 'Geannuleerd',
    classes: 'bg-red-100 text-red-700 line-through',
    icon: Ban
  }
}

export const STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: 'alle' | FactuurStatus
  label: string
}> = [
  { value: 'alle', label: 'Alle statussen' },
  { value: 'concept', label: 'Concepten' },
  { value: 'verstuurd', label: 'Verstuurd' },
  { value: 'betaald', label: 'Betaald' },
  { value: 'geannuleerd', label: 'Geannuleerd' }
]
