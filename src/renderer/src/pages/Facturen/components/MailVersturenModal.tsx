// src/renderer/src/pages/Facturen/components/MailVersturenModal.tsx

import { instellingenApi, mailApi } from '@renderer/api'
import { MailVersturenModal as GenericMailModal } from '@renderer/components/MailVersturenModal'
import { useEffect, useState } from 'react'
import { DEFAULT_MAIL_BODY, DEFAULT_MAIL_ONDERWERP } from '@shared/constants'
import type { Factuur } from '@shared/types'

interface Props {
  factuur: Factuur
  onClose: () => void
  onSuccess: () => void
}

export function MailVersturenModal({ factuur, onClose, onSuccess }: Props) {
  const [instellingen, setInstellingen] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    let cancelled = false
    void instellingenApi.getAll().then((data) => {
      if (!cancelled) setInstellingen(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!instellingen) return null

  return (
    <GenericMailModal
      klantEmail={factuur.klant.email}
      documentNummer={factuur.factuurNummer}
      documentType="Factuur"
      templateContext={{ type: 'factuur', factuur, instellingen }}
      onderwerpTemplate={instellingen.mail_onderwerp_template || DEFAULT_MAIL_ONDERWERP}
      bodyTemplate={instellingen.mail_body_template || DEFAULT_MAIL_BODY}
      attachmentFilename={`${factuur.factuurNummer}.pdf`}
      onSend={(values) =>
        mailApi.send({
          factuurId: factuur.id,
          ontvanger: values.ontvanger,
          onderwerp: values.onderwerp,
          body: values.body
        })
      }
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
