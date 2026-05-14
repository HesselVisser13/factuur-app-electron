// src/renderer/src/components/Toast.tsx

import { CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  type: ToastType
  message: string
}

type ToastContextValue = {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

let nextId = 1

interface ToastStyle {
  box: string
  iconColor: string
  Icon: LucideIcon
}

const styles: Record<ToastType, ToastStyle> = {
  success: {
    box: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-600',
    Icon: CheckCircle2
  },
  error: {
    box: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-600',
    Icon: XCircle
  },
  info: {
    box: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-600',
    Icon: Info
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback(
    (type: ToastType, message: string): void => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, type, message }])
      const duration = type === 'error' ? 6000 : 3500
      setTimeout(() => remove(id), duration)
    },
    [remove]
  )

  const value: ToastContextValue = {
    success: (m) => add('success', m),
    error: (m) => add('error', m),
    info: (m) => add('info', m)
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-100 space-y-2 pointer-events-none"
        role="region"
        aria-label="Notificaties"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const { box, iconColor, Icon } = styles[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto min-w-70 max-w-md rounded-lg shadow-lg border px-4 py-3 text-sm flex items-start gap-2 ${box}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1">{t.message}</div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="hover:opacity-70 p-0.5 rounded"
                aria-label="Sluiten"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
