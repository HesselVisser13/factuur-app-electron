// src/renderer/src/components/ErrorMessage.tsx

import { AlertCircle } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 text-red-700 font-medium">
        <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <p>{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Opnieuw proberen
        </button>
      )}
    </div>
  )
}
