// src/renderer/src/components/EmptyState.tsx

import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
        <Icon className="w-8 h-8 text-blue-600" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm inline-flex items-center gap-2"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
          {action.label}
        </button>
      )}
    </div>
  )
}
