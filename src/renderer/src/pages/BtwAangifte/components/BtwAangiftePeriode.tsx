//src/renderer/src/pages/BtwAangifte/components/BtwAangiftePeriode.tsx

import { KWARTALEN } from '@shared/constants'

const MIN_JAAR = 2020
const MAX_JAAR = 2100

interface Props {
  kwartaal: number
  jaar: number
  onKwartaalChange: (kwartaal: number) => void
  onJaarChange: (jaar: number) => void
}

export function BtwAangiftePeriode({ kwartaal, jaar, onKwartaalChange, onJaarChange }: Props) {
  const handleJaarChange = (raw: string): void => {
    const n = parseInt(raw, 10)
    if (isNaN(n)) return
    const clamped = Math.min(Math.max(n, MIN_JAAR), MAX_JAAR)
    onJaarChange(clamped)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-end flex-wrap">
      <div>
        <label htmlFor="btw-kwartaal" className="block text-sm font-medium text-gray-600 mb-1">
          Kwartaal
        </label>
        <select
          id="btw-kwartaal"
          value={kwartaal}
          onChange={(e) => onKwartaalChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {KWARTALEN.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="btw-jaar" className="block text-sm font-medium text-gray-600 mb-1">
          Jaar
        </label>
        <input
          id="btw-jaar"
          type="number"
          value={jaar}
          onChange={(e) => handleJaarChange(e.target.value)}
          min={MIN_JAAR}
          max={MAX_JAAR}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
        />
      </div>
    </div>
  )
}
