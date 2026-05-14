// src/renderer/src/components/ConfirmDialog.tsx

import { AlertTriangle, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handleAnswer = (answer: boolean): void => {
    resolver?.(answer)
    setOptions(null)
    setResolver(null)
  }

  const isDanger = options?.variant === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-90 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              {isDanger ? (
                <AlertTriangle
                  className="w-6 h-6 text-red-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="flex-1 space-y-2">
                {options.title && <h2 className="text-lg font-bold">{options.title}</h2>}
                <p className="text-sm text-gray-700 whitespace-pre-line">{options.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                {options.cancelText || 'Annuleren'}
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                autoFocus
                className={`px-4 py-2 text-white font-medium rounded-lg text-sm ${
                  isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {options.confirmText || 'Bevestigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
