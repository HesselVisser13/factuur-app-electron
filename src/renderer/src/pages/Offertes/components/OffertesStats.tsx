// src/renderer/src/pages/Offertes/components/OffertesStats.tsx

import { DocumentStats } from '@renderer/components/document-list'

interface Props {
  aantal: number
  totaalIncl: number
  openstaand: number
}

export function OffertesStats(props: Props) {
  return <DocumentStats {...props} openstaandLabel="Verzonden (open)" />
}
