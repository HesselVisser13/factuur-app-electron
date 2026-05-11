//src/renderer/src/pages/Transacties/components/TransactieFilters.tsx

interface Props {
  van: string
  tot: string
  onChange: (key: 'van' | 'tot', value: string) => void
}

export function TransactieFilters({ van, tot, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-end flex-wrap">
      <div>
        <label htmlFor="filter-van" className="block text-sm font-medium text-gray-600 mb-1">
          Van
        </label>
        <input
          id="filter-van"
          type="date"
          value={van}
          onChange={(e) => onChange('van', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="filter-tot" className="block text-sm font-medium text-gray-600 mb-1">
          Tot
        </label>
        <input
          id="filter-tot"
          type="date"
          value={tot}
          onChange={(e) => onChange('tot', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
