//src/renderer/src/pages/Klanten/components/KlantTypeToggle.tsx

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
        icon="👤"
        label="Particulier"
      />
      <ToggleButton
        selected={value === 'zakelijk'}
        onClick={() => onChange('zakelijk')}
        icon="🏢"
        label="Zakelijk"
      />
    </div>
  )
}

interface ToggleButtonProps {
  selected: boolean
  onClick: () => void
  icon: string
  label: string
}

function ToggleButton({ selected, onClick, icon, label }: ToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
        selected ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <span aria-hidden="true">{icon}</span> {label}
    </button>
  )
}
