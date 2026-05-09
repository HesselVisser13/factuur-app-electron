// src/renderer/src/components/FormError.tsx

interface FormErrorProps {
  message?: string
  className?: string
}

export function FormError({ message, className = 'mt-1' }: FormErrorProps) {
  if (!message) return null
  return <p className={`text-xs text-red-600 ${className}`}>{message}</p>
}
