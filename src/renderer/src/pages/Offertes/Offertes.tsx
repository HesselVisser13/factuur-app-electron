// src/renderer/src/pages/Offertes/Offertes.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { offertesApi } from '@renderer/api'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/Toast'
import { useLocalStorage } from '@renderer/hooks/useLocalStorage'
import type { OfferteStatus } from '@shared/schemas'
import type { Offerte } from '@shared/types'

import { OffertesFilters, type OfferteStatusFilter } from './components/OffertesFilters'
import { OffertesHeader } from './components/OffertesHeader'
import { OffertesStats } from './components/OffertesStats'
import { OffertesTabel } from './components/OffertesTabel'
import { OfferteMailVersturenModal } from './components/MailVersturenModal'
import { PdfPreviewModal } from '@renderer/components/PdfPreviewModal'

const STORAGE_KEYS = {
  zoek: 'offertes_zoek',
  status: 'offertes_status'
} as const

export function Offertes() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [offertes, setOffertes] = useState<Offerte[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [convertingId, setConvertingId] = useState<number | null>(null)
  const [mailOfferte, setMailOfferte] = useState<Offerte | null>(null)
  const [previewOfferte, setPreviewOfferte] = useState<Offerte | null>(null)

  const [zoek, setZoek] = useLocalStorage<string>(STORAGE_KEYS.zoek, '')
  const [statusFilter, setStatusFilter] = useLocalStorage<OfferteStatusFilter>(
    STORAGE_KEYS.status,
    'alle'
  )

  const loadSeqRef = useRef(0)

  const load = useCallback(async (): Promise<void> => {
    const seq = ++loadSeqRef.current
    setLoading(true)
    try {
      const data = await offertesApi.getAll()
      if (seq === loadSeqRef.current) {
        setOffertes(data)
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

  const handleStatusChange = async (
    offerte: Offerte,
    nieuwStatus: OfferteStatus
  ): Promise<void> => {
    if (pendingStatusId !== null) return

    if (nieuwStatus === 'afgewezen') {
      const ok = await confirm({
        title: 'Offerte afwijzen',
        message: `Weet je zeker dat je offerte ${offerte.offerteNummer} wilt markeren als afgewezen?`,
        variant: 'danger',
        confirmText: 'Markeer afgewezen'
      })
      if (!ok) return
    }

    setPendingStatusId(offerte.id)
    try {
      await offertesApi.updateStatus(offerte.id, nieuwStatus)
      toast.success(`Status bijgewerkt naar ${nieuwStatus}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setPendingStatusId(null)
    }
  }

  const handleDelete = async (offerte: Offerte): Promise<void> => {
    if (deletingId !== null) return

    const ok = await confirm({
      title: 'Offerte verwijderen',
      message: `Weet je zeker dat je offerte ${offerte.offerteNummer} wilt verwijderen?`,
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return

    setDeletingId(offerte.id)
    try {
      await offertesApi.delete(offerte.id)
      toast.success('Offerte verwijderd')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setDeletingId(null)
    }
  }

  const handleConverteer = async (offerte: Offerte): Promise<void> => {
    if (convertingId !== null) return

    const ok = await confirm({
      title: 'Omzetten naar factuur',
      message: `Wil je offerte ${offerte.offerteNummer} omzetten naar een factuur? Er wordt automatisch een nieuwe factuur aangemaakt op basis van deze offerte.`,
      confirmText: 'Omzetten'
    })
    if (!ok) return

    setConvertingId(offerte.id)
    try {
      const result = await offertesApi.converteerNaarFactuur(offerte.id)
      toast.success('Offerte omgezet naar factuur')
      await load()
      // Naar de nieuwe factuur navigeren
      navigate(`/facturen/${result.factuurId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Omzetten mislukt')
    } finally {
      setConvertingId(null)
    }
  }

  const handlePdfOpen = async (offerte: Offerte): Promise<void> => {
    try {
      await offertesApi.openPdf(offerte.id)
      toast.success(`PDF geopend voor offerte ${offerte.offerteNummer}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF openen mislukt')
    }
  }

  const handlePdfSaveAs = async (offerte: Offerte): Promise<void> => {
    try {
      const result = await offertesApi.opslaanPdfAls(offerte.id)
      if (result.saved) {
        toast.success(`PDF opgeslagen: ${result.filePath}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  const handleOpenFolder = async (): Promise<void> => {
    try {
      await offertesApi.openFolder()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Map openen mislukt')
    }
  }

  const handleViewFactuur = (offerte: Offerte): void => {
    if (offerte.factuurId) {
      navigate(`/facturen/${offerte.factuurId}`)
    }
  }

  // ============================================================
  // Filtering & stats (gememoized)
  // ============================================================

  const filtered = useMemo(() => {
    const q = zoek.toLowerCase().trim()
    return offertes.filter((o) => {
      if (statusFilter !== 'alle' && o.status !== statusFilter) return false
      if (!q) return true
      return (
        o.offerteNummer.toLowerCase().includes(q) ||
        (o.klant
          ? `${o.klant.voornaam ?? ''} ${o.klant.achternaam ?? ''} ${o.klant.bedrijfsnaam ?? ''}`
              .toLowerCase()
              .includes(q)
          : false) ||
        (o.referentie || '').toLowerCase().includes(q)
      )
    })
  }, [offertes, zoek, statusFilter])

  const stats = useMemo(() => {
    const totaalIncl = filtered.reduce((sum, o) => sum + o.totaalIncl, 0)
    const openstaand = filtered
      .filter((o) => o.status === 'verzonden')
      .reduce((sum, o) => sum + o.totaalIncl, 0)
    return { aantal: filtered.length, totaalIncl, openstaand }
  }, [filtered])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <OffertesHeader onOpenFolder={handleOpenFolder} onNew={() => navigate('/offertes/nieuw')} />

      <OffertesStats {...stats} />

      <OffertesFilters
        zoek={zoek}
        statusFilter={statusFilter}
        onZoekChange={setZoek}
        onStatusChange={setStatusFilter}
      />

      <OffertesTabel
        offertes={filtered}
        totalCount={offertes.length}
        loading={loading}
        pendingStatusId={pendingStatusId}
        deletingId={deletingId}
        convertingId={convertingId}
        onEdit={(o) => navigate(`/offertes/${o.id}`)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onConverteer={handleConverteer}
        onViewFactuur={handleViewFactuur}
        onPdfOpen={handlePdfOpen}
        onPdfSaveAs={handlePdfSaveAs}
        onAddNew={() => navigate('/offertes/nieuw')}
        onPdfPreview={setPreviewOfferte}
        onMail={setMailOfferte}
      />
      {mailOfferte && (
        <OfferteMailVersturenModal
          offerte={mailOfferte}
          onClose={() => setMailOfferte(null)}
          onSuccess={() => {
            setMailOfferte(null)
            void load()
          }}
        />
      )}
      <PdfPreviewModal
        documentNummer={previewOfferte?.offerteNummer ?? null}
        documentType="Offerte"
        fetchPdfBase64={() =>
          previewOfferte
            ? offertesApi.getPdfBuffer(previewOfferte.id)
            : Promise.reject(new Error('No offerte'))
        }
        onOpenExternal={() =>
          previewOfferte
            ? offertesApi.openPdf(previewOfferte.id).then(() => undefined)
            : Promise.resolve()
        }
        onSaveAs={() =>
          previewOfferte
            ? offertesApi.opslaanPdfAls(previewOfferte.id).then(() => undefined)
            : Promise.resolve()
        }
        onClose={() => setPreviewOfferte(null)}
      />
    </div>
  )
}
