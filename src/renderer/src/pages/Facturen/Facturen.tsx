//src/renderer/src/pages/Facturen/Facturen.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { facturenApi } from '@renderer/api/facturen'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { PdfPreviewModal } from '@renderer/components/PdfPreviewModal'
import { useToast } from '@renderer/components/Toast'
import { useLocalStorage } from '@renderer/hooks/useLocalStorage'
import type { FactuurStatus } from '@shared/schemas'
import type { Factuur } from '@shared/types'

import { FacturenFilters, type StatusFilter } from './components/FacturenFilters'
import { FacturenHeader } from './components/FacturenHeader'
import { FacturenStats } from './components/FacturenStats'
import { FacturenTabel } from './components/FacturenTabel'
import { MailVersturenModal } from './components/MailVersturenModal'
import { MailGeschiedenisModal } from './components/MailGeschiedenisModal'

const STORAGE_KEYS = {
  zoek: 'facturen_zoek',
  status: 'facturen_status'
} as const

export function Facturen() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [facturen, setFacturen] = useState<Factuur[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFactuur, setPreviewFactuur] = useState<Factuur | null>(null)
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [zoek, setZoek] = useLocalStorage<string>(STORAGE_KEYS.zoek, '')
  const [statusFilter, setStatusFilter] = useLocalStorage<StatusFilter>(STORAGE_KEYS.status, 'alle')

  const [mailFactuur, setMailFactuur] = useState<Factuur | null>(null)
  const [mailHistoryFactuur, setMailHistoryFactuur] = useState<Factuur | null>(null)

  /** Sequence ref voor race-safe load() */
  const loadSeqRef = useRef(0)

  const load = useCallback(async (): Promise<void> => {
    const seq = ++loadSeqRef.current
    setLoading(true)
    try {
      const data = await facturenApi.getAll()
      if (seq === loadSeqRef.current) {
        setFacturen(data)
      }
    } catch (err) {
      if (seq === loadSeqRef.current) {
        toast.error(err instanceof Error ? err.message : 'Fout bij laden')
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    void load()
    const seqRef = loadSeqRef
    return () => {
      seqRef.current++
    }
  }, [load])

  // ============================================================
  // Acties
  // ============================================================

  const handleStatusChange = async (f: Factuur, nieuwStatus: FactuurStatus): Promise<void> => {
    if (pendingStatusId !== null) return

    if (nieuwStatus === 'geannuleerd') {
      const ok = await confirm({
        title: 'Factuur annuleren',
        message: `Weet je zeker dat je factuur ${f.factuurNummer} wilt annuleren? Dit haalt ook de gekoppelde transacties weg.`,
        variant: 'danger',
        confirmText: 'Ja, factuur annuleren'
      })
      if (!ok) return
    }

    setPendingStatusId(f.id)
    try {
      await facturenApi.updateStatus(f.id, nieuwStatus)
      toast.success(`Status bijgewerkt naar ${nieuwStatus}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setPendingStatusId(null)
    }
  }

  const handleDelete = async (f: Factuur): Promise<void> => {
    if (deletingId !== null) return

    const ok = await confirm({
      title: 'Factuur verwijderen',
      message: `Weet je zeker dat je factuur ${f.factuurNummer} wilt verwijderen?`,
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return

    setDeletingId(f.id)
    try {
      await facturenApi.delete(f.id)
      toast.success('Factuur verwijderd')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePdfOpen = async (f: Factuur): Promise<void> => {
    try {
      await facturenApi.openPdf(f.id)
      toast.success(`PDF geopend voor factuur ${f.factuurNummer}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF openen mislukt')
    }
  }

  const handlePdfSaveAs = async (f: Factuur): Promise<void> => {
    try {
      const result = await facturenApi.opslaanPdfAls(f.id)
      if (result.saved) {
        toast.success(`PDF opgeslagen: ${result.filePath}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  const handleOpenFolder = async (): Promise<void> => {
    try {
      await facturenApi.openFolder()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Map openen mislukt')
    }
  }

  // ============================================================
  // Filtering & stats (gememoized)
  // ============================================================

  const filtered = useMemo(() => {
    const q = zoek.toLowerCase().trim()
    return facturen.filter((f) => {
      if (statusFilter !== 'alle' && f.status !== statusFilter) return false
      if (!q) return true
      return (
        f.factuurNummer.toLowerCase().includes(q) ||
        // Dunner: klantnaam-helper kan import-cycle geven, dus inline match
        // op factuur fields. Verfijning kan later.
        (f.klant
          ? `${f.klant.voornaam ?? ''} ${f.klant.achternaam ?? ''} ${f.klant.bedrijfsnaam ?? ''}`
              .toLowerCase()
              .includes(q)
          : false) ||
        (f.referentie || '').toLowerCase().includes(q)
      )
    })
  }, [facturen, zoek, statusFilter])

  const stats = useMemo(() => {
    const totaalIncl = filtered.reduce((sum, f) => sum + f.totaalIncl, 0)
    const openstaand = filtered
      .filter((f) => f.status === 'verstuurd')
      .reduce((sum, f) => sum + f.totaalIncl, 0)
    return { aantal: filtered.length, totaalIncl, openstaand }
  }, [filtered])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <FacturenHeader onOpenFolder={handleOpenFolder} onNew={() => navigate('/facturen/nieuw')} />

      <FacturenStats {...stats} />

      <FacturenFilters
        zoek={zoek}
        statusFilter={statusFilter}
        onZoekChange={setZoek}
        onStatusChange={setStatusFilter}
      />

      <FacturenTabel
        facturen={filtered}
        totalCount={facturen.length}
        loading={loading}
        pendingStatusId={pendingStatusId}
        deletingId={deletingId}
        onEdit={(f) => navigate(`/facturen/${f.id}`)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onPdfOpen={handlePdfOpen}
        onPdfSaveAs={handlePdfSaveAs}
        onPdfPreview={setPreviewFactuur}
        onMail={setMailFactuur}
        onShowMailHistory={setMailHistoryFactuur}
        onAddNew={() => navigate('/facturen/nieuw')}
      />

      <PdfPreviewModal
        documentNummer={previewFactuur?.factuurNummer ?? null}
        documentType="Factuur"
        fetchPdfBase64={() =>
          previewFactuur
            ? facturenApi.getPdfBuffer(previewFactuur.id)
            : Promise.reject(new Error('No factuur'))
        }
        onOpenExternal={() =>
          previewFactuur
            ? facturenApi.openPdf(previewFactuur.id).then(() => undefined)
            : Promise.resolve()
        }
        onSaveAs={() =>
          previewFactuur
            ? facturenApi.opslaanPdfAls(previewFactuur.id).then(() => undefined)
            : Promise.resolve()
        }
        onClose={() => setPreviewFactuur(null)}
      />

      {mailFactuur && (
        <MailVersturenModal
          factuur={mailFactuur}
          onClose={() => setMailFactuur(null)}
          onSuccess={() => {
            setMailFactuur(null)
            void load()
          }}
        />
      )}

      {mailHistoryFactuur && (
        <MailGeschiedenisModal
          factuur={mailHistoryFactuur}
          onClose={() => setMailHistoryFactuur(null)}
        />
      )}
    </div>
  )
}
