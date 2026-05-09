// src/renderer/src/components/Card.tsx

export type CardTone = 'info' | 'neutral' | 'danger' | 'success'

const TONE_CLASSES: Record<CardTone, string> = {
  info: 'border-blue-200 bg-blue-50',
  neutral: 'border-gray-200 bg-gray-50',
  danger: 'border-red-200 bg-red-50',
  success: 'border-green-200 bg-green-50'
}

interface CardProps {
  label: string
  value: string
  sub?: string
  tone?: CardTone
  onClick?: () => void
  ariaLabel?: string
}

export function Card({ label, value, sub, tone = 'neutral', onClick, ariaLabel }: CardProps) {
  const baseClasses = `rounded-xl border p-6 ${TONE_CLASSES[tone]}`

  const content = (
    <>
      <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-2">{sub}</div>}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={`${baseClasses} text-left w-full cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
      >
        {content}
      </button>
    )
  }

  return <div className={baseClasses}>{content}</div>
}
