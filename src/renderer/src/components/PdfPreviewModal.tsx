// src/renderer/src/components/PdfPreviewModal.tsx

import { useEffect, useState } from 'react'
import { facturenApi } from '../api/facturen'
import { useToast } from './Toast'

type Props = {
  factuurId: number | null
  factuurNummer?: string
  onClose: () => void
}

export function PdfPreviewModal({ factuurId, factuurNummer, onClose }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (factuurId === null) {
      setPdfUrl(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setPdfUrl(null)

    // Zorg dat PDF wordt (her)gegenereerd en laad via app-pdf:// protocol
    facturenApi
      .genereerPdf(factuurId)
      .then((result) => {
        if (!cancelled) {
          // Cache-buster zodat na bewerken de nieuwe PDF getoond wordt
          const url = `app-pdf://local/${encodeURIComponent(result.factuurNummer)}.pdf?t=${Date.now()}`
          setPdfUrl(url)
        }
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factuurId])

  // ESC-toets om te sluiten
  useEffect(() => {
    if (factuurId === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [factuurId, onClose])

  if (factuurId === null) return null

  async function handleDownload() {
    if (factuurId === null) return
    try {
      const result = await facturenApi.opslaanPdfAls(factuurId)
      if (result.saved) {
        toast.success('PDF opgeslagen')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  async function handleOpenExternal() {
    if (factuurId === null) return
    try {
      await facturenApi.openPdf(factuurId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Openen mislukt')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[95] flex flex-col p-4">
      <div className="flex items-center justify-between bg-white rounded-t-xl px-4 py-3 border-b border-gray-200">
        <div className="font-bold">📄 Voorbeeld{factuurNummer ? ` – ${factuurNummer}` : ''}</div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenExternal}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            title="Open in externe PDF-viewer"
          >
            🗗 Extern openen
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            💾 Opslaan als...
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700"
          >
            ✕ Sluiten
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-b-xl overflow-hidden">
        {loading && (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            PDF genereren...
          </div>
        )}
        {pdfUrl && (
          <iframe src={pdfUrl} title="Factuur PDF preview" className="w-full h-full border-0" />
        )}
      </div>
    </div>
  )
}
