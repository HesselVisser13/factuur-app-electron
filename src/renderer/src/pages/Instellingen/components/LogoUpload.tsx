// src/renderer/src/pages/Instellingen/components/LogoUpload.tsx

import { Image as ImageIcon, Trash2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { instellingenApi } from '@renderer/api'
import { useToast } from '@renderer/components/Toast'

import type { InstellingenFormValues } from '../instellingenFormSchema'

export function LogoUpload() {
  const toast = useToast()
  const { watch, setValue } = useFormContext<InstellingenFormValues>()
  const logoFilename = watch('logo_filename')

  const handleUpload = async (): Promise<void> => {
    try {
      const result = await instellingenApi.selectLogo()
      if (result?.fileName) {
        setValue('logo_filename', result.fileName, { shouldDirty: true })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Logo uploaden mislukt')
    }
  }

  const handleRemove = (): void => {
    setValue('logo_filename', '', { shouldDirty: true })
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">Bedrijfslogo</label>

      {logoFilename ? (
        <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <img
            src={`app-logo://${logoFilename}`}
            alt="Bedrijfslogo"
            className="h-16 w-auto object-contain"
          />
          <div className="flex-1 text-xs text-gray-500 truncate">{logoFilename}</div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Logo verwijderen"
            title="Verwijderen"
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Verwijderen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleUpload}
          className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg px-6 py-8 w-full text-gray-500 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
          Klik om een logo te uploaden (PNG/JPG)
        </button>
      )}
    </div>
  )
}
