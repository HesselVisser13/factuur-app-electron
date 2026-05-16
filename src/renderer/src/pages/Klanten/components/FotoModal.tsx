// src/renderer/src/pages/Klanten/components/FotoModal.tsx

import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import FocusLock from 'react-focus-lock'

import { fotosApi } from '@renderer/api'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/Toast'
import { formatDate } from '@renderer/utils/formatters'
import {
  formatBytes,
  getFotoThumbUrl,
  getFotoUrl,
  getPathsFromDropEvent
} from '@renderer/utils/foto'
import { klantDisplayNaam } from '@shared/klant-utils'
import type { FotoRecord, Klant } from '@shared/types'

interface Props {
  klant: Klant
  onClose: () => void
}

interface UploadProgress {
  current: number
  total: number
}

export function FotoModal({ klant, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()

  const [fotos, setFotos] = useState<FotoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [editingNotitieId, setEditingNotitieId] = useState<number | null>(null)
  const [notitieDraft, setNotitieDraft] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  // Race-condition guard
  const loadSeqRef = useRef(0)
  // Voor cleanup bij unmount
  const isMountedRef = useRef(true)

  // ============================================================
  // Notitie-cancel + escape (eerst gedeclareerd vanwege useEffect-deps)
  // ============================================================

  const cancelEditNotitie = useCallback((): void => {
    setEditingNotitieId(null)
    setNotitieDraft('')
  }, [])

  const handleEscapeNotitie = useCallback(async (): Promise<void> => {
    if (editingNotitieId === null) return
    const foto = fotos.find((f) => f.id === editingNotitieId)
    if (!foto) {
      cancelEditNotitie()
      return
    }
    const original = foto.notitie ?? ''
    const trimmed = notitieDraft.trim()

    // Geen wijziging → gewoon sluiten
    if (trimmed === original) {
      cancelEditNotitie()
      return
    }

    // Wijziging → vraag bevestiging
    const ok = await confirm({
      title: 'Wijzigingen verwerpen?',
      message: 'Je hebt de notitie aangepast maar nog niet opgeslagen.',
      variant: 'danger',
      confirmText: 'Verwerpen',
      cancelText: 'Blijf bewerken'
    })
    if (ok && isMountedRef.current) cancelEditNotitie()
  }, [editingNotitieId, fotos, notitieDraft, confirm, cancelEditNotitie])

  // ============================================================
  // Load foto's met race-protection
  // ============================================================
  const loadFotos = useCallback(async (): Promise<void> => {
    const seq = ++loadSeqRef.current
    try {
      const data = await fotosApi.listByKlant(klant.id)
      if (seq === loadSeqRef.current && isMountedRef.current) {
        setFotos(data)
      }
    } catch (err) {
      if (seq === loadSeqRef.current && isMountedRef.current) {
        toast.error(err instanceof Error ? err.message : "Foto's laden mislukt")
      }
    } finally {
      if (seq === loadSeqRef.current && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [klant.id, toast])

  useEffect(() => {
    void loadFotos()
  }, [loadFotos])

  // Cleanup bij unmount
  useEffect(() => {
    isMountedRef.current = true
    const seqRef = loadSeqRef
    return () => {
      isMountedRef.current = false
      seqRef.current++
    }
  }, [])

  // ============================================================
  // Keyboard handlers
  // ============================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null)
        } else if (editingNotitieId !== null) {
          void handleEscapeNotitie()
        } else if (uploadProgress === null) {
          onClose()
        }
      }
      // Pijl-navigatie in lightbox
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
          setLightboxIndex(lightboxIndex - 1)
        }
        if (e.key === 'ArrowRight' && lightboxIndex < fotos.length - 1) {
          setLightboxIndex(lightboxIndex + 1)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, lightboxIndex, editingNotitieId, fotos.length, uploadProgress, handleEscapeNotitie])

  // Body-scroll vergrendelen
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  // ============================================================
  // Upload handlers
  // ============================================================

  const handlePickAndUpload = async (): Promise<void> => {
    if (uploadProgress !== null) return

    try {
      const paths = await fotosApi.pickFiles()
      if (paths.length === 0) return
      await uploadFiles(paths)
    } catch (err) {
      if (isMountedRef.current) {
        toast.error(err instanceof Error ? err.message : 'Selecteren mislukt')
      }
    }
  }

  const uploadFiles = async (paths: string[]): Promise<void> => {
    if (paths.length === 0) return

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    setUploadProgress({ current: 0, total: paths.length })

    for (let i = 0; i < paths.length; i++) {
      if (!isMountedRef.current) break // user heeft modal gesloten

      const path = paths[i]
      try {
        const originalName = path.split(/[\\/]/).pop() || 'foto'
        await fotosApi.add({
          klantId: klant.id,
          sourcePath: path,
          originalName
        })
        successCount++
      } catch (err) {
        failCount++
        const msg = err instanceof Error ? err.message : 'Onbekende fout'
        errors.push(msg)
      }

      if (isMountedRef.current) {
        setUploadProgress({ current: i + 1, total: paths.length })
      }
    }

    if (!isMountedRef.current) return

    setUploadProgress(null)
    await loadFotos()

    if (successCount > 0 && failCount === 0) {
      toast.success(successCount === 1 ? 'Foto toegevoegd' : `${successCount} foto's toegevoegd`)
    } else if (successCount > 0 && failCount > 0) {
      toast.info(`${successCount} toegevoegd, ${failCount} mislukt: ${errors[0]}`)
    } else {
      toast.error(`Toevoegen mislukt: ${errors[0] ?? 'onbekend'}`)
    }
  }

  // ============================================================
  // Drag & drop
  // ============================================================
  const handleDragEnter = (e: React.DragEvent): void => {
    e.preventDefault()
    if (uploadProgress !== null) return
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    // Alleen sluiten als we de drop-zone echt verlaten (niet door child-element)
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = uploadProgress !== null ? 'none' : 'copy'
  }

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    setIsDragOver(false)
    if (uploadProgress !== null) return

    const paths = getPathsFromDropEvent(e)
    if (paths.length === 0) {
      toast.error('Kon bestandspaden niet lezen — gebruik de uploadknop')
      return
    }

    await uploadFiles(paths)
  }

  // ============================================================
  // Delete + actions
  // ============================================================

  const handleDelete = async (foto: FotoRecord): Promise<void> => {
    if (deletingId !== null) return

    const ok = await confirm({
      title: 'Foto verwijderen',
      message:
        'Weet je zeker dat je deze foto wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.',
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok || !isMountedRef.current) return

    setDeletingId(foto.id)
    try {
      await fotosApi.delete(foto.id)
      if (isMountedRef.current) {
        toast.success('Foto verwijderd')
        if (lightboxIndex !== null && fotos[lightboxIndex]?.id === foto.id) {
          setLightboxIndex(null)
        }
        await loadFotos()
      }
    } catch (err) {
      if (isMountedRef.current) {
        toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt')
      }
    } finally {
      if (isMountedRef.current) {
        setDeletingId(null)
      }
    }
  }

  const handleOpenExternal = async (foto: FotoRecord): Promise<void> => {
    try {
      await fotosApi.openExternal(foto.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Openen mislukt')
    }
  }

  // ============================================================
  // Notitie editing
  // ============================================================

  const startEditNotitie = (foto: FotoRecord): void => {
    setEditingNotitieId(foto.id)
    setNotitieDraft(foto.notitie ?? '')
  }

  const saveNotitie = async (foto: FotoRecord): Promise<void> => {
    const trimmed = notitieDraft.trim()
    if (trimmed === (foto.notitie ?? '')) {
      cancelEditNotitie()
      return
    }

    try {
      await fotosApi.updateNotitie(foto.id, trimmed || null)
      if (isMountedRef.current) {
        toast.success('Notitie opgeslagen')
        await loadFotos()
        cancelEditNotitie()
      }
    } catch (err) {
      if (isMountedRef.current) {
        toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
      }
    }
  }

  const handleNotitieKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    foto: FotoRecord
  ): void => {
    // Ctrl+Enter / Cmd+Enter = save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      void saveNotitie(foto)
    }
  }

  // ============================================================
  // Render
  // ============================================================

  const lightboxFoto = lightboxIndex !== null ? fotos[lightboxIndex] : null
  const isUploading = uploadProgress !== null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && lightboxIndex === null && !isUploading) onClose()
      }}
    >
      <FocusLock returnFocus disabled={lightboxIndex !== null}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="foto-modal-title"
          className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 id="foto-modal-title" className="text-xl font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" aria-hidden="true" />
                Foto&apos;s
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Klant: <strong>{klantDisplayNaam(klant)}</strong>
                {fotos.length > 0 && <span className="ml-2 text-gray-400">({fotos.length})</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              aria-label="Sluiten"
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div
            className={`flex-1 overflow-y-auto p-6 transition-colors ${
              isDragOver ? 'bg-blue-50' : ''
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Upload progress */}
            {isUploading && (
              <div
                role="status"
                aria-live="polite"
                className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3"
              >
                <Loader2
                  className="w-5 h-5 text-blue-600 animate-spin shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">
                    Foto&apos;s uploaden... ({uploadProgress.current} van {uploadProgress.total})
                  </div>
                  <div className="mt-1 h-2 bg-blue-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-gray-500">Laden...</div>
            ) : fotos.length === 0 ? (
              <EmptyDropZone onPickFiles={handlePickAndUpload} disabled={isUploading} />
            ) : (
              <>
                {/* Upload-knop */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm text-gray-600">
                    Sleep foto&apos;s hierheen of klik op de knop om toe te voegen.
                  </p>
                  <button
                    type="button"
                    onClick={handlePickAndUpload}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    Foto&apos;s toevoegen
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {fotos.map((foto, index) => (
                    <FotoTile
                      key={foto.id}
                      foto={foto}
                      isDeleting={deletingId === foto.id}
                      onClick={() => setLightboxIndex(index)}
                      onDelete={() => handleDelete(foto)}
                      onOpenExternal={() => handleOpenExternal(foto)}
                      isEditingNotitie={editingNotitieId === foto.id}
                      notitieDraft={notitieDraft}
                      onStartEditNotitie={() => startEditNotitie(foto)}
                      onChangeNotitie={setNotitieDraft}
                      onSaveNotitie={() => saveNotitie(foto)}
                      onCancelEditNotitie={cancelEditNotitie}
                      onNotitieKeyDown={(e) => handleNotitieKeyDown(e, foto)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Sluiten
            </button>
          </div>
        </div>
      </FocusLock>

      {/* Lightbox */}
      {lightboxFoto && lightboxIndex !== null && (
        <Lightbox
          foto={lightboxFoto}
          index={lightboxIndex}
          total={fotos.length}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
          onNext={() => setLightboxIndex(Math.min(fotos.length - 1, lightboxIndex + 1))}
        />
      )}
    </div>
  )
}

// ============================================================
// Empty drop-zone
// ============================================================

function EmptyDropZone({ onPickFiles, disabled }: { onPickFiles: () => void; disabled: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
        <ImageIcon className="w-8 h-8 text-blue-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen foto&apos;s</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
        Voeg foto&apos;s toe van de klantsituatie. Je kunt foto&apos;s slepen en loslaten in dit
        venster of een bestand selecteren.
      </p>
      <button
        type="button"
        onClick={onPickFiles}
        disabled={disabled}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Upload className="w-4 h-4" aria-hidden="true" />
        Eerste foto&apos;s toevoegen
      </button>
    </div>
  )
}

// ============================================================
// Foto tile
// ============================================================

interface FotoTileProps {
  foto: FotoRecord
  isDeleting: boolean
  onClick: () => void
  onDelete: () => void
  onOpenExternal: () => void
  isEditingNotitie: boolean
  notitieDraft: string
  onStartEditNotitie: () => void
  onChangeNotitie: (value: string) => void
  onSaveNotitie: () => void
  onCancelEditNotitie: () => void
  onNotitieKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function FotoTile({
  foto,
  isDeleting,
  onClick,
  onDelete,
  onOpenExternal,
  isEditingNotitie,
  notitieDraft,
  onStartEditNotitie,
  onChangeNotitie,
  onSaveNotitie,
  onCancelEditNotitie,
  onNotitieKeyDown
}: FotoTileProps) {
  const datum = foto.takenAt ?? foto.createdAt
  const thumbUrl = getFotoThumbUrl(foto.klantId, foto.filename)

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col ${
        isDeleting ? 'opacity-50' : ''
      }`}
    >
      {/* Thumbnail */}
      <button
        type="button"
        onClick={onClick}
        className="relative aspect-square bg-gray-100 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Bekijk foto: ${foto.originalName}`}
      >
        <img src={thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      </button>

      {/* Meta */}
      <div className="p-3 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between text-gray-500 gap-2">
          <span className="shrink-0">{formatDate(datum)}</span>
          <span className="shrink-0">{formatBytes(foto.bytes)}</span>
        </div>
        <div className="text-gray-400 truncate" title={foto.originalName}>
          {foto.originalName}
        </div>

        {/* Notitie inline editing */}
        {isEditingNotitie ? (
          <div className="space-y-1">
            <textarea
              value={notitieDraft}
              onChange={(e) => onChangeNotitie(e.target.value)}
              onKeyDown={onNotitieKeyDown}
              maxLength={500}
              rows={2}
              autoFocus
              placeholder="Voeg notitie toe..."
              aria-label="Foto-notitie"
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onSaveNotitie}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs font-medium"
                title="Ctrl+Enter"
              >
                Opslaan
              </button>
              <button
                type="button"
                onClick={onCancelEditNotitie}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-1 rounded text-xs font-medium"
              >
                Annuleer
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartEditNotitie}
            className="text-left text-gray-700 hover:text-gray-900 min-h-[2.5em] line-clamp-3"
          >
            {foto.notitie || (
              <span className="text-gray-400 italic">Klik om notitie toe te voegen</span>
            )}
          </button>
        )}

        {/* Acties */}
        <div className="flex items-center justify-end gap-1 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={onOpenExternal}
            aria-label="Open in externe viewer"
            title="Open in externe viewer"
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Verwijder foto"
            title="Verwijderen"
            className="p-1.5 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Lightbox
// ============================================================

interface LightboxProps {
  foto: FotoRecord
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function Lightbox({ foto, index, total, onClose, onPrev, onNext }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${index + 1} van ${total}: ${foto.originalName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Sluit-knop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-lg z-10"
      >
        <X className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Counter + filename */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-lg z-10 max-w-[60vw] truncate">
        {index + 1} / {total}
        <span className="ml-2 text-gray-300">{foto.originalName}</span>
      </div>

      {/* Vorige */}
      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          aria-label="Vorige foto"
          className="absolute left-4 text-white hover:bg-white/10 p-3 rounded-full z-10"
        >
          <ChevronLeft className="w-8 h-8" aria-hidden="true" />
        </button>
      )}

      {/* Foto */}
      <img
        src={getFotoUrl(foto.klantId, foto.filename)}
        alt={foto.originalName}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      {/* Volgende */}
      {index < total - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          aria-label="Volgende foto"
          className="absolute right-4 text-white hover:bg-white/10 p-3 rounded-full z-10"
        >
          <ChevronRight className="w-8 h-8" aria-hidden="true" />
        </button>
      )}

      {/* Notitie onder foto */}
      {foto.notitie && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl bg-black/70 text-white p-3 rounded-lg text-sm">
          {foto.notitie}
        </div>
      )}
    </div>
  )
}
