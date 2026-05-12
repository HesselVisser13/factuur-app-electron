//src/renderer/src/pages/Facturen/components/FactuurActieMenu.tsx

import { useEffect, useRef, useState } from 'react'

import type { FactuurStatus } from '@shared/schemas'
import type { Factuur } from '@shared/types'

interface Props {
  factuur: Factuur
  busy: boolean
  onEdit: () => void
  onStatusChange: (status: FactuurStatus) => void
  onDelete: () => void
  onPdfOpen: () => void
  onPdfSaveAs: () => void
  onPdfPreview: () => void
}

interface MenuItem {
  label: string
  icon: string
  action: () => void
  className?: string
  divider?: boolean
}

export function FactuurActieMenu({
  factuur,
  busy,
  onEdit,
  onStatusChange,
  onDelete,
  onPdfOpen,
  onPdfSaveAs,
  onPdfPreview
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sluit bij Escape, scroll en klik buiten
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleScroll = (): void => setOpen(false)

    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true) // true = capture (ook in containers)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  const pdfItems: MenuItem[] = [
    { label: 'Voorbeeld', icon: '👁️', action: onPdfPreview, divider: true },
    { label: 'Open PDF', icon: '📄', action: onPdfOpen },
    { label: 'Opslaan als...', icon: '💾', action: onPdfSaveAs }
  ]

  const items: MenuItem[] = (() => {
    switch (factuur.status) {
      case 'concept':
        return [
          { label: 'Bewerken', icon: '✏️', action: onEdit },
          {
            label: 'Markeer als verstuurd',
            icon: '📤',
            action: () => onStatusChange('verstuurd'),
            className: 'text-blue-600'
          },
          {
            label: 'Verwijderen',
            icon: '🗑️',
            action: onDelete,
            className: 'text-red-600'
          },
          ...pdfItems
        ]
      case 'verstuurd':
        return [
          { label: 'Bekijken', icon: '👁️', action: onEdit },
          {
            label: 'Markeer als betaald',
            icon: '✅',
            action: () => onStatusChange('betaald'),
            className: 'text-green-600'
          },
          {
            label: 'Annuleren',
            icon: '🚫',
            action: () => onStatusChange('geannuleerd'),
            className: 'text-red-600'
          },
          ...pdfItems
        ]
      case 'betaald':
      case 'geannuleerd':
        return [{ label: 'Bekijken', icon: '👁️', action: onEdit }, ...pdfItems]
    }
  })()

  const handleItemClick = (action: () => void): void => {
    setOpen(false)
    action()
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Acties voor factuur ${factuur.factuurNummer}`}
        className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600 font-medium disabled:opacity-50"
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1 text-left"
        >
          {items.map((item, i) => (
            <div key={`${item.label}-${i}`}>
              {item.divider && <div className="border-t border-gray-100 my-1" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(item.action)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                  item.className ?? ''
                }`}
              >
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
