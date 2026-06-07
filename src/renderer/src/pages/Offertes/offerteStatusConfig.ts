// src/renderer/src/pages/Offertes/OfferteStatusConfig.ts

import {
  ArrowRightCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  Send,
  XCircle,
  type LucideIcon
} from 'lucide-react'

import type { OfferteStatus } from '@shared/schemas'

export interface OfferteStatusInfo {
  label: string
  classes: string
  icon: LucideIcon
}

export const OFFERTE_STATUS_CONFIG: Record<OfferteStatus, OfferteStatusInfo> = {
  concept: {
    label: 'Concept',
    classes: 'bg-gray-100 text-gray-700',
    icon: FileEdit
  },
  verzonden: {
    label: 'Verzonden',
    classes: 'bg-blue-100 text-blue-700',
    icon: Send
  },
  geaccepteerd: {
    label: 'Geaccepteerd',
    classes: 'bg-green-100 text-green-700',
    icon: CheckCircle2
  },
  afgewezen: {
    label: 'Afgewezen',
    classes: 'bg-red-100 text-red-700',
    icon: XCircle
  },
  verlopen: {
    label: 'Verlopen',
    classes: 'bg-amber-100 text-amber-700',
    icon: Clock
  },
  omgezet: {
    label: 'Omgezet → factuur',
    classes: 'bg-purple-100 text-purple-700',
    icon: ArrowRightCircle
  }
}

export const OFFERTE_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: 'alle' | OfferteStatus
  label: string
}> = [
  { value: 'alle', label: 'Alle statussen' },
  { value: 'concept', label: 'Concepten' },
  { value: 'verzonden', label: 'Verzonden' },
  { value: 'geaccepteerd', label: 'Geaccepteerd' },
  { value: 'afgewezen', label: 'Afgewezen' },
  { value: 'verlopen', label: 'Verlopen' },
  { value: 'omgezet', label: 'Omgezet' }
]
