// src/renderer/src/components/MailVersturenModal.tsx

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2, Mail, Paperclip, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import FocusLock from 'react-focus-lock'
import { useForm } from 'react-hook-form'

import { instellingenApi, mailApi } from '@renderer/api'
import { FormError } from '@renderer/components/FormError'
import { useToast } from '@renderer/components/Toast'
import { inputClasses } from '@renderer/utils/inputClasses'
import { renderTemplate, type TemplateContext } from '@renderer/utils/mail-template'
import { MailFormSchema, type MailFormValues } from '@renderer/pages/Facturen/mailFormSchema'
import type { MailAuthStatus, MailResult } from '@shared/mail-types'

interface BaseProps {
  /** Email-adres van de klant (default ontvanger) */
  klantEmail: string | null | undefined
  /** Document-nummer voor titel (bv. "2026-001" of "2026-O001") */
  documentNummer: string
  /** Type voor titel ("Factuur" / "Offerte") */
  documentType: 'Factuur' | 'Offerte'
  /** Voor template-rendering */
  templateContext: TemplateContext
  /** Default mail-onderwerp template uit instellingen */
  onderwerpTemplate: string
  /** Default mail-body template uit instellingen */
  bodyTemplate: string
  /** Bijlage-bestandsnaam (bv. "2026-O001.pdf") */
  attachmentFilename: string
  /** Aanroep om mail te versturen */
  onSend: (values: { ontvanger: string; onderwerp: string; body: string }) => Promise<MailResult>
  onClose: () => void
  onSuccess: () => void
}

export function MailVersturenModal({
  klantEmail,
  documentNummer,
  documentType,
  templateContext,
  onderwerpTemplate,
  bodyTemplate,
  attachmentFilename,
  onSend,
  onClose,
  onSuccess
}: BaseProps) {
  const toast = useToast()
  const [authStatus, setAuthStatus] = useState<MailAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitted }
  } = useForm<MailFormValues>({
    resolver: zodResolver(MailFormSchema),
    defaultValues: {
      ontvanger: klantEmail ?? '',
      onderwerp: '',
      body: ''
    },
    mode: 'onBlur'
  })

  // Auth-check + templates renderen
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [status] = await Promise.all([mailApi.getAuthStatus(), instellingenApi.getAll()])
        if (cancelled) return

        setAuthStatus(status)

        reset({
          ontvanger: klantEmail ?? '',
          onderwerp: renderTemplate(onderwerpTemplate, templateContext),
          body: renderTemplate(bodyTemplate, templateContext)
        })
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Kon gegevens niet laden')
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

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  const onSubmit = async (values: MailFormValues): Promise<void> => {
    const result = await onSend({
      ontvanger: values.ontvanger,
      onderwerp: values.onderwerp,
      body: values.body
    })

    if (result.success) {
      toast.success(`Mail verzonden naar ${values.ontvanger}`)
      onSuccess()
    } else {
      toast.error(result.error ?? 'Verzenden mislukt')
    }
  }

  const onInvalid = (): void => {
    toast.error('Controleer de gemarkeerde velden')
  }

  if (loading) {
    return (
      <Backdrop onClose={onClose}>
        <Container>
          <div className="p-12 text-center text-gray-500">Laden...</div>
        </Container>
      </Backdrop>
    )
  }

  if (!authStatus?.authenticated) {
    return (
      <Backdrop onClose={onClose}>
        <Container>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Niet verbonden met Gmail</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Je moet eerst een Gmail-account verbinden via <strong>Instellingen → Mail</strong>{' '}
                voordat je kunt versturen.
              </span>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Sluiten
              </button>
            </div>
          </div>
        </Container>
      </Backdrop>
    )
  }

  return (
    <Backdrop onClose={onClose}>
      <Container>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" aria-hidden="true" />
              {documentType} {documentNummer} versturen
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Verzonden vanaf: <strong>{authStatus.email}</strong>
            </p>
          </div>

          <div>
            <label
              htmlFor="mail-ontvanger"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Naar *
            </label>
            <input
              id="mail-ontvanger"
              type="email"
              {...register('ontvanger')}
              className={inputClasses(!!errors.ontvanger)}
              aria-invalid={!!errors.ontvanger}
            />
            <FormError message={errors.ontvanger?.message} />
            {!klantEmail && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Geen e-mail bekend bij deze klant — vul handmatig in.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="mail-onderwerp"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Onderwerp *
            </label>
            <input
              id="mail-onderwerp"
              type="text"
              {...register('onderwerp')}
              className={inputClasses(!!errors.onderwerp)}
              aria-invalid={!!errors.onderwerp}
            />
            <FormError message={errors.onderwerp?.message} />
          </div>

          <div>
            <label htmlFor="mail-body" className="block text-sm font-medium text-gray-600 mb-1">
              Bericht *
            </label>
            <textarea
              id="mail-body"
              rows={10}
              {...register('body')}
              className={inputClasses(!!errors.body)}
              aria-invalid={!!errors.body}
            />
            <FormError message={errors.body?.message} />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
            <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              De {documentType.toLowerCase()} wordt als PDF-bijlage meegestuurd:{' '}
              <code className="bg-blue-100 px-1 rounded font-mono text-xs">
                {attachmentFilename}
              </code>
            </span>
          </div>

          {isSubmitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              Controleer de gemarkeerde velden.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Verstuur
                </>
              )}
            </button>
          </div>
        </form>
      </Container>
    </Backdrop>
  )
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <FocusLock returnFocus>{children}</FocusLock>
    </div>
  )
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      {children}
    </div>
  )
}
