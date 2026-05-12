//src/renderer/src/pages/Facturen/components/FactuurActieMenu.tsx

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  onMail: () => void
  onShowMailHistory: () => void
}

interface MenuItem {
  label: string
  icon: string
  action: () => void
  className?: string
  divider?: boolean
}

interface Position {
  top: number
  left: number
}

const MENU_WIDTH = 192 // w-48 = 12rem
const MENU_OFFSET = 4

export function FactuurActieMenu({
  factuur,
  busy,
  onEdit,
  onStatusChange,
  onDelete,
  onPdfOpen,
  onPdfSaveAs,
  onPdfPreview,
  onMail,
  onShowMailHistory
}: Props) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Bereken positie bij openen
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const estimatedMenuHeight = 280 // ruwe schatting voor flip-detect

    let top = rect.bottom + MENU_OFFSET
    let left = rect.right - MENU_WIDTH

    // Flip omhoog als niet genoeg ruimte naar beneden
    if (top + estimatedMenuHeight > window.innerHeight) {
      top = rect.top - estimatedMenuHeight - MENU_OFFSET
    }

    // Voorkom dat menu links uit beeld valt
    if (left < 8) left = 8

    setPosition({ top, left })
  }, [open])

  // Sluit bij Escape, scroll, klik buiten
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as Node
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    const handleScroll = (): void => setOpen(false)

    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  const pdfItems: MenuItem[] = [
    { label: 'Mailen', icon: '📧', action: onMail, divider: true },
    { label: 'Mail-geschiedenis', icon: '📬', action: onShowMailHistory },
    { label: 'Voorbeeld', icon: '👁️', action: onPdfPreview },
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
    <>
      <button
        ref={buttonRef}
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

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: MENU_WIDTH
            }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 text-left"
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
          </div>,
          document.body
        )}
    </>
  )
}
