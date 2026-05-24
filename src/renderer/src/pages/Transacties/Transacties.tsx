//src/renderer/src/pages/Transacties/Transacties.tsx

// Externe libs
import { useState } from 'react'
import { Plus, Receipt, X } from 'lucide-react'

// Aliased imports
import { btwTarievenApi, transactiesApi } from '@renderer/api'
import { useConfirm } from '@renderer/components/ConfirmDialog'
import { ErrorMessage } from '@renderer/components/ErrorMessage'
import { useToast } from '@renderer/components/Toast'
import { useApi } from '@renderer/hooks/useApi'
import { useLocalStorage } from '@renderer/hooks/useLocalStorage'
import type { BtwTarief, Transactie } from '@shared/types'

// Relatief
import { TransactieFilters } from './components/TransactieFilters'
import { TransactieForm } from './components/TransactieForm'
import { TransactiesTabel } from './components/TransactiesTabel'
import type { FormState } from './types'

const currentYear = new Date().getFullYear()
const DEFAULT_VAN = `${currentYear}-01-01`
const DEFAULT_TOT = `${currentYear}-12-31`

const STORAGE_KEYS = {
  van: 'transacties_van',
  tot: 'transacties_tot'
} as const

export function Transacties() {
  const [van, setVan] = useLocalStorage<string>(STORAGE_KEYS.van, DEFAULT_VAN)
  const [tot, setTot] = useLocalStorage<string>(STORAGE_KEYS.tot, DEFAULT_TOT)

  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const toast = useToast()
  const confirm = useConfirm()

  const {
    data: transacties,
    loading,
    error,
    refetch
  } = useApi<Transactie[]>(() => transactiesApi.list(van, tot), [van, tot])

  const { data: tarieven } = useApi<BtwTarief[]>(() => btwTarievenApi.getActief(), [])

  const updateFilter = (key: 'van' | 'tot', value: string): void => {
    if (key === 'van') setVan(value)
    else setTot(value)
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (deletingId !== null) return

    const ok = await confirm({
      title: 'Transactie verwijderen',
      message: 'Weet je zeker dat je deze transactie wilt verwijderen?',
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return

    setDeletingId(id)
    try {
      await transactiesApi.delete(id)
      toast.success('Transactie verwijderd')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (t: Transactie): void => {
    setFormState({ mode: 'edit', transactie: t })
  }

  const handleToggleNew = (): void => {
    setFormState((prev) => (prev.mode === 'closed' ? { mode: 'create' } : { mode: 'closed' }))
  }

  const handleCloseForm = (): void => {
    setFormState({ mode: 'closed' })
  }

  /** Na succesvolle create/edit. */
  const handleFormSuccess = (action: 'created' | 'updated'): void => {
    if (action === 'updated') {
      setFormState({ mode: 'closed' })
    }
    // Bij 'created' blijft de form open (rapid entry mode)
    refetch()
  }

  const formIsOpen = formState.mode !== 'closed'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-7 h-7 text-blue-600" aria-hidden="true" />
          Transacties
        </h1>
        <button
          type="button"
          onClick={handleToggleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
        >
          {formIsOpen ? (
            <>
              <X className="w-4 h-4" aria-hidden="true" />
              Annuleren
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nieuwe transactie
            </>
          )}
        </button>
      </div>

      {formIsOpen && tarieven && (
        <TransactieForm
          key={formState.mode === 'edit' ? `edit-${formState.transactie.id}` : 'create'}
          mode={formState}
          tarieven={tarieven}
          onSuccess={handleFormSuccess}
          onCancel={handleCloseForm}
        />
      )}

      <TransactieFilters van={van} tot={tot} onChange={updateFilter} />

      {loading && <div className="text-center py-12 text-gray-500">Laden...</div>}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && transacties && (
        <TransactiesTabel
          transacties={transacties}
          deletingId={deletingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleToggleNew}
        />
      )}
    </div>
  )
}
