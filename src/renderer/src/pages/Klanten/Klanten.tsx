//src/renderer/src/pages/Klanten/Klanten.ts

import { useCallback, useEffect, useRef, useState } from 'react'

import { klantenApi } from '@renderer/api/klanten'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/Toast'
import { klantDisplayNaam } from '@shared/klant-utils'
import type { Klant } from '@shared/types'

import { KlantenTabel } from './components/KlantenTabel'
import { KlantModal } from './components/KlantModal'
import { Users, Plus } from 'lucide-react'

export function Klanten() {
  const [klanten, setKlanten] = useState<Klant[]>([])
  const [zoek, setZoek] = useState('')
  const [modalKlant, setModalKlant] = useState<Klant | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const toast = useToast()
  const confirm = useConfirm()

  /**
   * Telt mee welke load() de meest recente is. Oude responses
   * die later binnenkomen worden genegeerd.
   */
  const loadSeqRef = useRef(0)

  const load = useCallback(async (): Promise<void> => {
    const seq = ++loadSeqRef.current
    try {
      const data = await klantenApi.getAll()
      // Alleen state updaten als dit nog steeds de laatste request is
      if (seq === loadSeqRef.current) {
        setKlanten(data)
      }
    } catch (err) {
      if (seq === loadSeqRef.current) {
        toast.error(err instanceof Error ? err.message : 'Fout bij laden')
      }
    }
  }, [toast])

  // Initiële load + cleanup
  useEffect(() => {
    void load()
    const seqRef = loadSeqRef
    return () => {
      // Alle in-flight responses ongeldig maken bij unmount
      seqRef.current++
    }
  }, [load])

  const openNew = (): void => {
    setModalKlant(null)
    setModalOpen(true)
  }

  const openEdit = (k: Klant): void => {
    setModalKlant(k)
    setModalOpen(true)
  }

  const handleDelete = async (k: Klant): Promise<void> => {
    if (deletingId !== null) return // dubbele klik / parallel verzoek blokkeren

    const ok = await confirm({
      title: 'Klant verwijderen',
      message: `Weet je zeker dat je "${klantDisplayNaam(k)}" wilt verwijderen?`,
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return

    setDeletingId(k.id)
    try {
      await klantenApi.delete(k.id)
      toast.success('Klant verwijderd')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = klanten.filter((k) => {
    const q = zoek.toLowerCase()
    return (
      klantDisplayNaam(k).toLowerCase().includes(q) ||
      (k.plaats || '').toLowerCase().includes(q) ||
      (k.email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" aria-hidden="true" />
          Klanten
        </h1>
        <button
          type="button"
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nieuwe klant
        </button>
      </div>

      <input
        type="search"
        placeholder="Zoek op naam, plaats of e-mail..."
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        aria-label="Zoek klanten"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
      />

      <KlantenTabel
        klanten={filtered}
        totalCount={klanten.length}
        deletingId={deletingId}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {modalOpen && (
        <KlantModal
          klant={modalKlant}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            setModalOpen(false)
            await load()
          }}
        />
      )}
    </div>
  )
}
