// src/renderer/src/pages/Facturen/components/MailGeschiedenisModal.tsx

import { useEffect, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { Check, Inbox, Mailbox, X, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

import { mailApi } from '@renderer/api'
import { useToast } from '@renderer/components/Toast'
import { formatDate } from '@renderer/utils/formatters'
import type { MailLogEntry } from '@shared/mail-types'
import type { Factuur } from '@shared/types'

interface Props {
  factuur: Factuur
  onClose: () => void
}

export function MailGeschiedenisModal({ factuur, onClose }: Props) {
  const toast = useToast()
  const [logs, setLogs] = useState<MailLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Logs ophalen
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const data = await mailApi.getLog(factuur.id)
        if (!cancelled) setLogs(data)
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Kon geschiedenis niet laden')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factuur.id])

  // Escape sluit modal
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Body-scroll vergrendelen
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mail-history-title"
          className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 id="mail-history-title" className="text-xl font-bold flex items-center gap-2">
                  <Mailbox className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  Mail-geschiedenis
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Factuur <strong>{factuur.factuurNummer}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Sluiten"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">Laden...</div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                <Inbox className="w-12 h-12 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                Voor deze factuur zijn nog geen mails verzonden.
              </div>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <MailLogRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  />
                ))}
              </ul>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      </FocusLock>
    </div>
  )
}

// ============================================================
// Row
// ============================================================

interface RowProps {
  log: MailLogEntry
  expanded: boolean
  onToggle: () => void
}

function MailLogRow({ log, expanded, onToggle }: RowProps) {
  const isSent = log.status === 'sent'

  return (
    <li className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <StatusBadge status={log.status} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{log.ontvanger}</div>
            <div className="text-xs text-gray-500 truncate">{log.onderwerp}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-2">
          <span>{formatDateTime(log.verzondenOp)}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3 text-sm">
          {!isSent && log.errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700 text-xs">
              <strong>Foutmelding:</strong> {log.errorMsg}
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Bericht
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans bg-white p-3 rounded border border-gray-200 max-h-64 overflow-y-auto">
              {log.body}
            </pre>
          </div>

          {log.messageId && (
            <div className="text-xs text-gray-400">
              Gmail message ID: <code>{log.messageId}</code>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

// ============================================================
// Status badge
// ============================================================

function StatusBadge({ status }: { status: 'sent' | 'failed' }) {
  if (status === 'sent') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 whitespace-nowrap inline-flex items-center gap-1">
        <Check className="w-3 h-3" aria-hidden="true" />
        Verzonden
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 whitespace-nowrap inline-flex items-center gap-1">
      <XCircle className="w-3 h-3" aria-hidden="true" />
      Mislukt
    </span>
  )
}

// ============================================================
// Date helper
// ============================================================

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const datum = formatDate(iso)
  const tijd = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return `${datum} om ${tijd}`
}
