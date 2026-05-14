// src/renderer/src/pages/Instellingen/components/MailSectie.tsx

import { AlertTriangle, CheckCircle2, Link2, Loader2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { mailApi } from '@renderer/api'
import { FormError } from '@renderer/components/FormError'
import { useToast } from '@renderer/components/Toast'
import { inputClasses } from '@renderer/utils/inputClasses'
import {
  DEFAULT_MAIL_BODY,
  DEFAULT_MAIL_ONDERWERP,
  MAIL_TEMPLATE_PLACEHOLDERS
} from '@shared/constants'
import type { MailAuthStatus } from '@shared/mail-types'

import type { InstellingenFormValues } from '../instellingenFormSchema'

export function MailSectie() {
  const toast = useToast()
  const {
    register,
    formState: { errors }
  } = useFormContext<InstellingenFormValues>()

  const [status, setStatus] = useState<MailAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(false)

  const refreshStatus = async (): Promise<void> => {
    try {
      const result = await mailApi.getAuthStatus()
      setStatus(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kon mail-status niet ophalen')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async (): Promise<void> => {
    setAuthenticating(true)
    try {
      const result = await mailApi.authenticate()
      setStatus(result)
      toast.success(`Verbonden als ${result.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verbinden mislukt')
    } finally {
      setAuthenticating(false)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    try {
      await mailApi.disconnect()
      await refreshStatus()
      toast.success('Verbinding verbroken')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verbinding verbreken mislukt')
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Mail className="w-4 h-4" aria-hidden="true" />
        Mail
      </h2>

      {/* Verbindingsstatus */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Gmail-verbinding</h3>

        {loading ? (
          <p className="text-sm text-gray-500">Status laden...</p>
        ) : !status?.configured ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Mail-functionaliteit is niet geconfigureerd. Neem contact op met de ontwikkelaar.
            </span>
          </div>
        ) : status.authenticated ? (
          <div className="flex items-center justify-between gap-4 p-3 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
              <span className="text-sm">
                Verbonden als <strong>{status.email}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Verbinding verbreken
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Verbind een Gmail-account om facturen direct vanuit de app te versturen.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={authenticating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {authenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Verbinden...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" aria-hidden="true" />
                  Verbind met Gmail
                </>
              )}
            </button>
            {authenticating && (
              <p className="text-xs text-gray-500 mt-2">
                Er is een browser-tabblad geopend. Volg daar de Google-login.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Standaard mail-templates</h3>

        <div>
          <label
            htmlFor="mail_onderwerp_template"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Onderwerp
          </label>
          <input
            id="mail_onderwerp_template"
            type="text"
            placeholder={DEFAULT_MAIL_ONDERWERP}
            {...register('mail_onderwerp_template')}
            className={inputClasses(!!errors.mail_onderwerp_template)}
            aria-invalid={!!errors.mail_onderwerp_template}
          />
          <FormError message={errors.mail_onderwerp_template?.message} />
        </div>

        <div>
          <label
            htmlFor="mail_body_template"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Bericht
          </label>
          <textarea
            id="mail_body_template"
            rows={8}
            placeholder={DEFAULT_MAIL_BODY}
            {...register('mail_body_template')}
            className={inputClasses(!!errors.mail_body_template)}
            aria-invalid={!!errors.mail_body_template}
          />
          <FormError message={errors.mail_body_template?.message} />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
            Beschikbare placeholders
          </summary>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-gray-600 pl-2">
            {MAIL_TEMPLATE_PLACEHOLDERS.map((p) => (
              <div key={p.key} className="flex justify-between gap-2">
                <code className="bg-gray-100 px-1 rounded">{`{${p.key}}`}</code>
                <span className="text-gray-500">{p.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 pl-2">
            Tip: typ <code className="bg-gray-100 px-1 rounded">{'{factuurNummer}'}</code> om
            automatisch het factuurnummer in te voegen.
          </p>
        </details>
      </div>
    </section>
  )
}
