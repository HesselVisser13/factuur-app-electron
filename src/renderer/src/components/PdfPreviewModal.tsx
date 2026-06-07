// src/renderer/src/components/PdfPreviewModal.tsx

import { ExternalLink, FileText, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useToast } from './Toast'

interface Props {
  /** `null` = modal niet open. Anders: nummer voor in titel. */
  documentNummer: string | null
  /** Titel-prefix, bv. "Factuur" of "Offerte" */
  documentType: string
  /** Roept de backend om PDF als base64 te krijgen */
  fetchPdfBase64: () => Promise<string>
  /** Open in externe viewer */
  onOpenExternal: () => Promise<void>
  /** Save as dialog */
  onSaveAs: () => Promise<void>
  onClose: () => void
}

export function PdfPreviewModal({
  documentNummer,
  documentType,
  fetchPdfBase64,
  onOpenExternal,
  onSaveAs,
  onClose
}: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (documentNummer === null) {
      setPdfUrl(null)
      return
    }

    let cancelled = false
    let createdUrl: string | null = null

    setLoading(true)
    setPdfUrl(null)

    fetchPdfBase64()
      .then((base64) => {
        if (cancelled) return
        const blob = base64ToBlob(base64, 'application/pdf')
        createdUrl = URL.createObjectURL(blob)
        setPdfUrl(createdUrl)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Preview laden mislukt')
          onClose()
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentNummer])

  useEffect(() => {
    if (documentNummer === null) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [documentNummer, onClose])

  if (documentNummer === null) return null

  async function handleOpenExternal(): Promise<void> {
    try {
      await onOpenExternal()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Openen mislukt')
    }
  }

  async function handleSaveAs(): Promise<void> {
    try {
      await onSaveAs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-95 flex flex-col p-4">
      <div className="flex items-center justify-between bg-white rounded-t-xl px-4 py-3 border-b border-gray-200">
        <div className="font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
          Voorbeeld – {documentType} {documentNummer}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOpenExternal}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            title="Open in externe PDF-viewer"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Extern openen
          </button>
          <button
            type="button"
            onClick={handleSaveAs}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Opslaan als...
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Sluiten
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-b-xl overflow-hidden">
        {loading && (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            PDF genereren...
          </div>
        )}
        {pdfUrl && <iframe src={pdfUrl} title="PDF voorbeeld" className="w-full h-full border-0" />}
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
}
