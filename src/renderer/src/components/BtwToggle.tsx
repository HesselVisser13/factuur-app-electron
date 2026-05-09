// src/renderer/src/components/BtwToggle.tsx

interface BtwToggleProps {
  toonExcl: boolean
  onChange: (toonExcl: boolean) => void
}

export function BtwToggle({ toonExcl, onChange }: BtwToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="BTW weergave"
      className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden text-sm"
    >
      <ToggleButton selected={!toonExcl} onClick={() => onChange(false)} label="Incl. BTW" />
      <ToggleButton selected={toonExcl} onClick={() => onChange(true)} label="Excl. BTW" />
    </div>
  )
}

interface ToggleButtonProps {
  selected: boolean
  onClick: () => void
  label: string
}

function ToggleButton({ selected, onClick, label }: ToggleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
        selected ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}
