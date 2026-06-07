// src/renderer/src/pages/Offertes/components/OfferteActieMenu.tsx

import {
  ArrowRightCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Mail,
  Pencil,
  Save,
  Send,
  Trash2,
  XCircle
} from 'lucide-react'
import type { ComponentType } from 'react'

import type { OfferteStatus } from '@shared/schemas'
import type { Offerte } from '@shared/types'

interface Props {
  offerte: Offerte
  busy: boolean
  onEdit: () => void
  onStatusChange: (status: OfferteStatus) => void
  onDelete: () => void
  onConverteer: () => void
  onViewFactuur: () => void
  onPdfOpen: () => void
  onPdfSaveAs: () => void
  onPdfPreview: () => void
  onMail: () => void
}

export function OfferteActieMenu({
  offerte,
  busy,
  onEdit,
  onStatusChange,
  onDelete,
  onConverteer,
  onViewFactuur,
  onPdfOpen,
  onPdfSaveAs,
  onPdfPreview,
  onMail
}: Props) {
  const status = offerte.status

  return (
    <div className="flex items-center justify-end gap-1">
      {status === 'concept' && (
        <>
          <ActionButton
            onClick={onEdit}
            disabled={busy}
            icon={Pencil}
            title="Bewerken"
            color="blue"
          />
          <ActionButton
            onClick={() => onStatusChange('verzonden')}
            disabled={busy}
            icon={Send}
            title="Markeer als verzonden"
            color="blue"
          />
          <ActionButton
            onClick={onDelete}
            disabled={busy}
            icon={Trash2}
            title="Verwijderen"
            color="red"
          />
        </>
      )}

      {status === 'verzonden' && (
        <>
          <ActionButton
            onClick={() => onStatusChange('geaccepteerd')}
            disabled={busy}
            icon={CheckCircle2}
            title="Markeer geaccepteerd"
            color="green"
          />
          <ActionButton
            onClick={() => onStatusChange('afgewezen')}
            disabled={busy}
            icon={XCircle}
            title="Markeer afgewezen"
            color="red"
          />
        </>
      )}

      {status === 'geaccepteerd' && (
        <ActionButton
          onClick={onConverteer}
          disabled={busy}
          icon={ArrowRightCircle}
          title="Omzetten naar factuur"
          color="green"
          label="Omzetten"
        />
      )}

      {status === 'omgezet' && offerte.factuurId !== null && (
        <ActionButton
          onClick={onViewFactuur}
          disabled={busy}
          icon={ExternalLink}
          title="Bekijk factuur"
          color="purple"
          label="Naar factuur"
        />
      )}

      <ActionButton onClick={onMail} disabled={busy} icon={Mail} title="Mailen" color="blue" />

      <ActionButton
        onClick={onPdfPreview}
        disabled={busy}
        icon={Eye}
        title="Voorbeeld"
        color="blue"
      />

      <ActionButton
        onClick={onPdfOpen}
        disabled={busy}
        icon={ExternalLink}
        title="Open PDF"
        color="blue"
      />

      <ActionButton
        onClick={onPdfSaveAs}
        disabled={busy}
        icon={Save}
        title="PDF opslaan als..."
        color="blue"
      />
    </div>
  )
}

interface ActionButtonProps {
  onClick: () => void
  disabled: boolean
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  color: 'blue' | 'green' | 'red' | 'purple'
  label?: string
}

function ActionButton({ onClick, disabled, icon: Icon, title, color, label }: ActionButtonProps) {
  const colors = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-green-600 hover:bg-green-50',
    red: 'text-red-600 hover:bg-red-50',
    purple: 'text-purple-600 hover:bg-purple-50'
  }[color]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-2 rounded-lg disabled:opacity-50 ${colors} flex items-center gap-1 text-sm font-medium`}
    >
      <Icon className="w-4 h-4" aria-hidden={true} />
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}
