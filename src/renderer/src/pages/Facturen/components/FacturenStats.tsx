// src/renderer/src/pages/Facturen/components/FacturenStats.tsx

import { DocumentStats } from '@renderer/components/document-list'

interface Props {
  aantal: number
  totaalIncl: number
  openstaand: number
}

export function FacturenStats(props: Props) {
  return <DocumentStats {...props} openstaandLabel="Openstaand" />
}
