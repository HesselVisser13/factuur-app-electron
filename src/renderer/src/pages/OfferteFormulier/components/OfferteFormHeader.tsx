// src/renderer/src/pages/OfferteFormulier/components/OfferteFormHeader.tsx

import { ArrowLeft, ExternalLink, Eye, Mail, Save, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  editId: number | null
  offerteNummer: string
  readOnly: boolean
  saving: boolean
  onPreview?: () => void
  onPdfOpen?: () => void
  onPdfSaveAs?: () => void
  onMail?: () => void
}

export function OfferteFormHeader({
  editId,
  offerteNummer,
  readOnly,
  saving,
  onPreview,
  onPdfOpen,
  onPdfSaveAs,
  onMail
}: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between">
      <div>
        <button
          type="button"
          onClick={() => navigate('/offertes')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Terug naar offertes
        </button>
        <h1 className="text-2xl font-bold">
          {editId
            ? `Offerte ${offerteNummer}${readOnly ? ' (alleen lezen)' : ''}`
            : 'Nieuwe offerte'}
        </h1>
      </div>

      <div className="flex gap-2">
        {editId && onPreview && (
          <SecondaryButton onClick={onPreview} icon={Eye} label="Voorbeeld" />
        )}
        {editId && onPdfOpen && (
          <SecondaryButton onClick={onPdfOpen} icon={ExternalLink} label="PDF" />
        )}
        {editId && onPdfSaveAs && (
          <SecondaryButton onClick={onPdfSaveAs} icon={Save} label="Opslaan als..." />
        )}
        {editId && onMail && <SecondaryButton onClick={onMail} icon={Mail} label="Mailen" />}

        {!readOnly && (
          <>
            <button
              type="button"
              onClick={() => navigate('/offertes')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              Annuleren
            </button>
            <button
              type="submit"
              form="offerte-form"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : editId ? 'Bijwerken' : 'Offerte opslaan'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SecondaryButton({
  onClick,
  icon: Icon,
  label
}: {
  onClick: () => void
  icon: LucideIcon
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label}
    </button>
  )
}
