// src/renderer/src/components/Toast.tsx

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

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

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

let nextId = 1

const styles: Record<ToastType, { box: string; icon: string }> = {
  success: { box: 'bg-green-50 border-green-200 text-green-800', icon: '✅' },
  error: { box: 'bg-red-50 border-red-200 text-red-800', icon: '❌' },
  info: { box: 'bg-blue-50 border-blue-200 text-blue-800', icon: 'ℹ️' }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback(
    (type: ToastType, message: string) => {
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
      <div className="fixed bottom-4 right-4 z-100 space-y-2 pointer-events-none">
        {toasts.map((t) => {
          const s = styles[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto min-w-70 max-w-md rounded-lg shadow-lg border px-4 py-3 text-sm flex items-start gap-2 ${s.box}`}
            >
              <span>{s.icon}</span>
              <div className="flex-1">{t.message}</div>
              <button
                onClick={() => remove(t.id)}
                className="hover:opacity-70 font-bold"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
