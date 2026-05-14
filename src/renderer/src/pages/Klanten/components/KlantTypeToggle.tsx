// src/renderer/src/pages/Klanten/components/KlantTypeToggle.tsx

import { Building2, User, type LucideIcon } from 'lucide-react'

interface Props {
  value: 'particulier' | 'zakelijk'
  onChange: (value: 'particulier' | 'zakelijk') => void
}

export function KlantTypeToggle({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Klanttype" className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <ToggleButton
        selected={value === 'particulier'}
        onClick={() => onChange('particulier')}
        Icon={User}
        label="Particulier"
      />
      <ToggleButton
        selected={value === 'zakelijk'}
        onClick={() => onChange('zakelijk')}
        Icon={Building2}
        label="Zakelijk"
      />
    </div>
  )
}

interface ToggleButtonProps {
  selected: boolean
  onClick: () => void
  Icon: LucideIcon
  label: string
}

function ToggleButton({ selected, onClick, Icon, label }: ToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
        selected ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label}
    </button>
  )
}
