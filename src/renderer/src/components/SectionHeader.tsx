// src/renderer/src/components/SectionHeader.tsx

import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  action?: ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</h2>
      {action}
    </div>
  )
}
