//src/renderer/src/pages/Klanten/components/KlantenTabel.tsx

import { Camera, Pencil, Plus, Trash2, Users } from 'lucide-react'

import { EmptyState } from '@renderer/components/EmptyState'
import { klantDisplayNaam } from '@shared/klant-utils'
import type { Klant } from '@shared/types'

interface Props {
  klanten: Klant[]
  totalCount: number
  deletingId: number | null
  onEdit: (k: Klant) => void
  onDelete: (k: Klant) => void
  onAddNew?: () => void
  onShowFotos: (k: Klant) => void
}

export function KlantenTabel({
  klanten,
  totalCount,
  deletingId,
  onEdit,
  onDelete,
  onAddNew,
  onShowFotos
}: Props) {
  if (klanten.length === 0) {
    if (totalCount === 0 && onAddNew) {
      return (
        <EmptyState
          icon={Users}
          title="Nog geen klanten"
          description="Voeg je eerste klant toe om facturen te kunnen versturen. Je kunt particulieren én bedrijven toevoegen."
          action={{
            label: 'Eerste klant toevoegen',
            onClick: onAddNew,
            icon: Plus
          }}
        />
      )
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        Geen klanten gevonden met deze zoekterm.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th scope="col" className="text-left px-4 py-3">
              Naam
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Type
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Plaats
            </th>
            <th scope="col" className="text-left px-4 py-3">
              E-mail
            </th>
            <th scope="col" className="text-right px-4 py-3">
              Acties
            </th>
          </tr>
        </thead>
        <tbody>
          {klanten.map((k) => {
            const isDeleting = deletingId === k.id
            return (
              <tr
                key={k.id}
                className={`border-t border-gray-100 hover:bg-gray-50 ${
                  isDeleting ? 'opacity-50' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium">{klantDisplayNaam(k)}</td>
                <td className="px-4 py-3">
                  <KlantTypeBadge type={k.type} />
                </td>
                <td className="px-4 py-3 text-gray-600">{k.plaats || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{k.email || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onShowFotos(k)}
                      aria-label={`Foto's van ${klantDisplayNaam(k)}`}
                      title="Foto's"
                      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                      <Camera className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(k)}
                      disabled={isDeleting}
                      aria-label={`Bewerk ${klantDisplayNaam(k)}`}
                      title="Bewerken"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(k)}
                      disabled={deletingId !== null}
                      aria-label={`Verwijder ${klantDisplayNaam(k)}`}
                      title="Verwijderen"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KlantTypeBadge({ type }: { type: 'particulier' | 'zakelijk' }) {
  const isZakelijk = type === 'zakelijk'
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        isZakelijk ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
      }`}
    >
      {isZakelijk ? 'Zakelijk' : 'Particulier'}
    </span>
  )
}
