// src/renderer/src/pages/Instellingen/components/BtwTarievenSectie.tsx

import { Pencil, Percent, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { btwTarievenApi } from '@renderer/api/btw-tarieven'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { useToast } from '@renderer/components/Toast'
import type { BtwTarief } from '@shared/types'

interface EditState {
  id: number | null // null = nieuw
  naam: string
  percentage: string
}

export function BtwTarievenSectie() {
  const toast = useToast()
  const confirm = useConfirm()

  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [loading, setLoading] = useState(true)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [busy, setBusy] = useState(false)

  const loadTarieven = useCallback(async (): Promise<void> => {
    try {
      const data = await btwTarievenApi.getActief()
      setTarieven(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Laden mislukt')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadTarieven()
  }, [loadTarieven])

  const handleStartNew = (): void => {
    setEditState({ id: null, naam: '', percentage: '' })
  }

  const handleStartEdit = (tarief: BtwTarief): void => {
    setEditState({
      id: tarief.id,
      naam: tarief.naam,
      percentage: String(tarief.percentage)
    })
  }

  const handleCancelEdit = (): void => {
    setEditState(null)
  }

  const handleSave = async (): Promise<void> => {
    if (!editState || busy) return

    const naam = editState.naam.trim()
    const percentage = parseFloat(editState.percentage)

    if (!naam) {
      toast.error('Naam is verplicht')
      return
    }
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Percentage moet tussen 0 en 100 zijn')
      return
    }

    setBusy(true)
    try {
      if (editState.id === null) {
        await btwTarievenApi.create({ naam, percentage })
        toast.success('Tarief toegevoegd')
      } else {
        await btwTarievenApi.update({ id: editState.id, naam, percentage })
        toast.success('Tarief bijgewerkt')
      }
      setEditState(null)
      await loadTarieven()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (tarief: BtwTarief): Promise<void> => {
    if (busy) return

    const ok = await confirm({
      title: 'BTW-tarief verwijderen',
      message: `Weet je zeker dat je "${tarief.naam}" (${tarief.percentage}%) wilt verwijderen?`,
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return

    setBusy(true)
    try {
      await btwTarievenApi.delete(tarief.id)
      toast.success('Tarief verwijderd')
      await loadTarieven()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Percent className="w-4 h-4" aria-hidden="true" />
          BTW-tarieven
        </h2>
        {!editState && (
          <button
            type="button"
            onClick={handleStartNew}
            disabled={busy}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tarief toevoegen
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Pas de BTW-tarieven aan als de wetgeving wijzigt. Bestaande facturen behouden hun
        oorspronkelijke tarief en worden niet aangepast.
      </p>

      {loading ? (
        <div className="text-center text-gray-500 text-sm py-4">Laden...</div>
      ) : (
        <div className="space-y-2">
          {tarieven.map((tarief) => (
            <div
              key={tarief.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
            >
              {editState?.id === tarief.id ? (
                <EditForm
                  state={editState}
                  busy={busy}
                  onChange={setEditState}
                  onSave={handleSave}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <>
                  <div>
                    <div className="font-medium">{tarief.naam}</div>
                    <div className="text-sm text-gray-500">{tarief.percentage}%</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(tarief)}
                      disabled={busy || editState !== null}
                      aria-label={`Bewerk ${tarief.naam}`}
                      title="Bewerken"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tarief)}
                      disabled={busy || editState !== null}
                      aria-label={`Verwijder ${tarief.naam}`}
                      title="Verwijderen"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Nieuwe tarief inline form */}
          {editState?.id === null && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
              <EditForm
                state={editState}
                busy={busy}
                onChange={setEditState}
                onSave={handleSave}
                onCancel={handleCancelEdit}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

interface EditFormProps {
  state: EditState
  busy: boolean
  onChange: (s: EditState) => void
  onSave: () => void
  onCancel: () => void
}

function EditForm({ state, busy, onChange, onSave, onCancel }: EditFormProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={state.naam}
        onChange={(e) => onChange({ ...state, naam: e.target.value })}
        placeholder="Naam (bv. Hoog tarief)"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        maxLength={50}
        autoFocus
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={state.percentage}
          onChange={(e) => onChange({ ...state, percentage: e.target.value })}
          placeholder="21"
          className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg disabled:opacity-50"
      >
        Opslaan
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1.5"
      >
        Annuleer
      </button>
    </div>
  )
}
