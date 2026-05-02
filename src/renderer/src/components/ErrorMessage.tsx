// src/renderer/src/components/ErrorMessage.tsx

interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-700 font-medium">❌ {message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Opnieuw proberen
        </button>
      )}
    </div>
  )
}
