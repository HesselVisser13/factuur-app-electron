// src/renderer/src/pages/Instellingen/Instellingen.tsx

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Settings, AlertTriangle, Loader2, Save } from 'lucide-react'

import { instellingenApi } from '@renderer/api'
import { btwTarievenApi } from '@renderer/api/btw-tarieven'
import { useToast } from '@renderer/components/Toast'
import type { BtwTarief } from '@shared/types'

import { AdresSectie } from './components/AdresSectie'
import { BedrijfsgegevensSectie } from './components/BedrijfsgegevensSectie'
import { FactuurSectie } from './components/FactuurSectie'
import { FinancieelSectie } from './components/FinancieelSectie'
import { ReiskostenSectie } from './components/ReiskostenSectie'
import { MailSectie } from './components/MailSectie'
import { InstellingenFormSchema, type InstellingenFormValues } from './instellingenFormSchema'
import { defaultInstellingen, mapToForm } from './types'

export function Instellingen() {
  const toast = useToast()
  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [loading, setLoading] = useState(true)

  const methods = useForm<InstellingenFormValues>({
    resolver: zodResolver(InstellingenFormSchema),
    defaultValues: defaultInstellingen,
    mode: 'onBlur'
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isSubmitted, errors }
  } = methods

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [data, tarievenData] = await Promise.all([
          instellingenApi.getAll(),
          btwTarievenApi.getActief()
        ])
        if (cancelled) return
        setTarieven(tarievenData)
        reset(mapToForm(data))
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Fout bij laden')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: InstellingenFormValues): Promise<void> => {
    try {
      await instellingenApi.save(values)
      toast.success('Instellingen opgeslagen')
      // Form opnieuw "schoon" markeren zodat isDirty resetten
      reset(values)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  const onInvalid = (): void => {
    toast.error('Controleer de gemarkeerde velden')
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Laden...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-7 h-7 text-blue-600" aria-hidden="true" />
        Instellingen
      </h1>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6">
          <BedrijfsgegevensSectie />
          <AdresSectie />
          <FinancieelSectie />
          <ReiskostenSectie tarieven={tarieven} />
          <MailSectie />
          <FactuurSectie />

          {isSubmitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              Er zijn nog fouten in het formulier. Controleer de gemarkeerde velden.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  Opslaan
                </>
              )}
            </>
          </button>
        </form>
      </FormProvider>
    </div>
  )
}
