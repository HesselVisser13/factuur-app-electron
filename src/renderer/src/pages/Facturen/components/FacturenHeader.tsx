//src/renderer/src/pages/Facturen/components/FacturenHeader.tsx

import { FileText, FolderOpen, Plus } from 'lucide-react'

interface Props {
  onOpenFolder: () => void
  onNew: () => void
}

export function FacturenHeader({ onOpenFolder, onNew }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-7 h-7 text-blue-600" aria-hidden="true" />
        Facturen
      </h1>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenFolder}
          title="Open de map met alle factuur-PDF's"
          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" aria-hidden="true" />
          PDF-map
        </button>
        <button
          type="button"
          onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nieuwe factuur
        </button>
      </div>
    </div>
  )
}
