// src/renderer/src/pages/FactuurFormulier/components/FactuurFormHeader.tsx

import { useNavigate } from 'react-router-dom'

interface FactuurFormHeaderProps {
  editId: number | null
  factuurNummer: string
  readOnly: boolean
  saving: boolean
  onPreview: () => void
  onPdfOpen: () => void
  onPdfSaveAs: () => void
  onMail?: () => void
}

export function FactuurFormHeader({
  editId,
  factuurNummer,
  readOnly,
  saving,
  onPreview,
  onPdfOpen,
  onPdfSaveAs,
  onMail
}: FactuurFormHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between">
      <div>
        <button
          type="button"
          onClick={() => navigate('/facturen')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1"
        >
          ← Terug naar facturen
        </button>
        <h1 className="text-2xl font-bold">
          {editId
            ? `Factuur ${factuurNummer}${readOnly ? ' (alleen lezen)' : ''}`
            : 'Nieuwe factuur'}
        </h1>
      </div>

      <div className="flex gap-2">
        {editId && (
          <>
            <SecondaryButton onClick={onPreview} icon="👁️" label="Voorbeeld" />
            <SecondaryButton onClick={onPdfOpen} icon="📄" label="PDF" />
            <SecondaryButton onClick={onPdfSaveAs} icon="💾" label="Opslaan als..." />
            {onMail && <SecondaryButton onClick={onMail} icon="📧" label="Mailen" />}
          </>
        )}

        {!readOnly && (
          <>
            <button
              type="button"
              onClick={() => navigate('/facturen')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              Annuleren
            </button>
            <button
              type="submit"
              form="factuur-form"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : editId ? 'Bijwerken' : 'Factuur opslaan'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SecondaryButton({
  onClick,
  icon,
  label
}: {
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm"
    >
      <span aria-hidden="true">{icon}</span> {label}
    </button>
  )
}
