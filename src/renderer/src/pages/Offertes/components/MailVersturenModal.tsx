// src/renderer/src/pages/Offertes/components/MailVersturenModal.tsx

import { useEffect, useState } from 'react'

import { instellingenApi, mailApi } from '@renderer/api'
import { MailVersturenModal as GenericMailModal } from '@renderer/components/MailVersturenModal'
import { DEFAULT_MAIL_OFFERTE_BODY, DEFAULT_MAIL_OFFERTE_ONDERWERP } from '@shared/constants'
import type { Offerte } from '@shared/types'

interface Props {
  offerte: Offerte
  onClose: () => void
  onSuccess: () => void
}

export function OfferteMailVersturenModal({ offerte, onClose, onSuccess }: Props) {
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
      klantEmail={offerte.klant.email}
      documentNummer={offerte.offerteNummer}
      documentType="Offerte"
      templateContext={{ type: 'offerte', offerte, instellingen }}
      onderwerpTemplate={
        instellingen.mail_offerte_onderwerp_template || DEFAULT_MAIL_OFFERTE_ONDERWERP
      }
      bodyTemplate={instellingen.mail_offerte_body_template || DEFAULT_MAIL_OFFERTE_BODY}
      attachmentFilename={`${offerte.offerteNummer}.pdf`}
      onSend={(values) =>
        mailApi.sendOfferte({
          offerteId: offerte.id,
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
