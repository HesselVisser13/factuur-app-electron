// src/renderer/src/pages/OfferteFormulier/OfferteFormulier.tsx

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { btwTarievenApi, offertesApi } from '@renderer/api'
import { instellingenApi } from '@renderer/api/instellingen'
import { klantenApi } from '@renderer/api/klanten'
import {
  emptyRegel,
  OpmerkingenSectie,
  RegelsSectie,
  ReistijdSectie,
  TotalenSectie,
  type ReistijdInstellingen
} from '@renderer/components/document-form'
import { useToast } from '@renderer/components/Toast'
import {
  datumInputUit,
  isGeldigeDatumString,
  toDatumInput,
  voegDagenToe
} from '@renderer/utils/datum'
import { STANDAARD_TARIEF_NAAM, vindTariefOpNaam } from '@shared/constants'
import type { OfferteInput } from '@shared/schemas'
import type { BtwTarief, Klant, Offerte } from '@shared/types'

import { BasisgegevensSectie } from './components/BasisgegevensSectie'
import { OfferteFormHeader } from './components/OfferteFormHeader'
import { DocumentTypeSectie } from './components/DocumentTypeSectie'
import {
  OfferteFormSchema,
  type OfferteFormOutput,
  type OfferteFormValues,
  type RegelFormValues
} from './offerteFormSchema'
import { PdfPreviewModal } from '@renderer/components/PdfPreviewModal'
import { OfferteMailVersturenModal } from '@renderer/pages/Offertes/components/MailVersturenModal'

const DEFAULT_GELDIGHEID_DAGEN = 30

const initialDefaults: OfferteFormValues = {
  klantId: null,
  datum: toDatumInput(),
  geldigTot: toDatumInput(),
  referentie: '',
  opmerkingen: '',
  toonAkkoordBlok: false,
  isPrijsopgave: false,
  regels: [],
  reistijd: {
    enabled: false,
    uren: '1',
    km: '',
    omschrijving: 'Reistijd',
    btwTariefId: null,
    btwPercentage: 0
  }
}

export function OfferteFormulier() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const editId = params.id ? parseInt(params.id, 10) : null
  const toast = useToast()

  const [klanten, setKlanten] = useState<Klant[]>([])
  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [offerteNummer, setOfferteNummer] = useState('')
  const [bestaandeOfferte, setBestaandeOfferte] = useState<Offerte | null>(null)
  const [reistijdInstellingen, setReistijdInstellingen] = useState<ReistijdInstellingen>({
    uurtarief: 0,
    kmtarief: 0
  })
  const [previewOpen, setPreviewOpen] = useState(false)

  const [loading, setLoading] = useState(true)

  const [mailModalOpen, setMailModalOpen] = useState(false)

  const methods = useForm<OfferteFormValues, unknown, OfferteFormOutput>({
    resolver: zodResolver(OfferteFormSchema),
    defaultValues: initialDefaults,
    mode: 'onBlur'
  })

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
    setValue
  } = methods

  const readOnly = bestaandeOfferte !== null && bestaandeOfferte.status !== 'concept'

  // ============================================================
  // Initiële data laden
  // ============================================================
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [klantenData, tarievenData, instellingen] = await Promise.all([
          klantenApi.getAll(),
          btwTarievenApi.getActief(),
          instellingenApi.getAll()
        ])
        if (cancelled) return

        const uurtarief = parseFloat(instellingen.reiskosten_uurtarief || '0') || 0
        const kmtarief = parseFloat(instellingen.reiskosten_kmtarief || '0') || 0
        const standaardOms = instellingen.reiskosten_omschrijving || 'Reistijd'
        const reisBtwTariefId = parseInt(instellingen.reiskosten_btw_tarief_id || '0', 10) || null
        const reisBtwTarief =
          (reisBtwTariefId && tarievenData.find((t) => t.id === reisBtwTariefId)) || null

        setKlanten(klantenData)
        setTarieven(tarievenData)
        setReistijdInstellingen({ uurtarief, kmtarief })

        if (editId) {
          const offerte = await offertesApi.getById(editId)
          if (cancelled) return
          setBestaandeOfferte(offerte)
          setOfferteNummer(offerte.offerteNummer)

          reset({
            klantId: offerte.klantId,
            datum: datumInputUit(offerte.datum),
            geldigTot: datumInputUit(offerte.geldigTot),
            referentie: offerte.referentie || '',
            opmerkingen: offerte.opmerkingen || '',
            toonAkkoordBlok: offerte.toonAkkoordBlok,
            isPrijsopgave: offerte.isPrijsopgave ?? false,
            regels: offerte.regels.map<RegelFormValues>((r) => ({
              _uid: crypto.randomUUID(),
              datum: datumInputUit(r.datum),
              omschrijving: r.omschrijving,
              aantal: String(r.aantal),
              prijsPerStuk: String(r.prijsPerStuk),
              btwTariefId: r.btwTariefId,
              btwPercentage: r.btwPercentage
            })),
            reistijd: {
              enabled: offerte.reistijdUren !== null,
              uren: offerte.reistijdUren !== null ? String(offerte.reistijdUren) : '1',
              km:
                offerte.reistijdKm !== null && offerte.reistijdKm !== undefined
                  ? String(offerte.reistijdKm)
                  : '',
              omschrijving: offerte.reistijdOmschrijving || standaardOms,
              btwTariefId: offerte.reistijdBtwTariefId ?? reisBtwTarief?.id ?? null,
              btwPercentage: offerte.reistijdBtwPercentage ?? reisBtwTarief?.percentage ?? 0
            }
          })
        } else {
          const standaardTarief =
            vindTariefOpNaam(tarievenData, STANDAARD_TARIEF_NAAM) ?? tarievenData[0] ?? null

          reset({
            ...initialDefaults,
            geldigTot: voegDagenToe(initialDefaults.datum, DEFAULT_GELDIGHEID_DAGEN),
            regels: standaardTarief ? [emptyRegel(standaardTarief)] : [],
            reistijd: {
              ...initialDefaults.reistijd,
              omschrijving: standaardOms,
              btwTariefId: reisBtwTarief?.id ?? standaardTarief?.id ?? null,
              btwPercentage: reisBtwTarief?.percentage ?? standaardTarief?.percentage ?? 0
            }
          })
        }
      } catch (err) {
        if (cancelled) return
        toast.error('Fout bij laden: ' + (err instanceof Error ? err.message : 'onbekend'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  // ============================================================
  // Auto-update geldigTot + offertenummer
  // ============================================================
  const datum = watch('datum')

  useEffect(() => {
    if (editId || !isGeldigeDatumString(datum)) return
    setValue('geldigTot', voegDagenToe(datum, DEFAULT_GELDIGHEID_DAGEN))
  }, [datum, editId, setValue])

  useEffect(() => {
    if (editId || !isGeldigeDatumString(datum)) return
    let cancelled = false
    offertesApi
      .getNextNummer(datum)
      .then((n) => {
        if (!cancelled) setOfferteNummer(n)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [datum, editId])

  // ============================================================
  // Submit
  // ============================================================
  const onSubmit = async (values: OfferteFormOutput): Promise<void> => {
    try {
      const reistijdInput =
        values.reistijd.enabled && values.reistijd.btwTariefId
          ? {
              uren: parseFloat(values.reistijd.uren) || 0,
              km: values.reistijd.km ? parseFloat(values.reistijd.km) : null,
              btwTariefId: values.reistijd.btwTariefId,
              btwPercentage: values.reistijd.btwPercentage,
              omschrijving: values.reistijd.omschrijving || 'Reistijd'
            }
          : null

      const input: OfferteInput = {
        klantId: values.klantId,
        datum: values.datum,
        geldigTot: values.geldigTot,
        referentie: values.referentie || undefined,
        opmerkingen: values.opmerkingen || undefined,
        toonAkkoordBlok: values.toonAkkoordBlok,
        isPrijsopgave: values.isPrijsopgave,
        regels: values.regels.map((r) => ({
          datum: r.datum,
          omschrijving: r.omschrijving,
          aantal: parseFloat(r.aantal.replace(',', '.')) || 0,
          prijsPerStuk: parseFloat(r.prijsPerStuk) || 0,
          btwTariefId: r.btwTariefId,
          btwPercentage: r.btwPercentage
        })),
        reistijd: reistijdInput
      }

      if (editId) {
        await offertesApi.update({ ...input, id: editId })
        toast.success('Offerte bijgewerkt')
      } else {
        await offertesApi.create(input)
        toast.success('Offerte aangemaakt')
      }
      navigate('/offertes')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  const onInvalid = (): void => {
    toast.error('Controleer de gemarkeerde velden')
  }

  const handlePdfOpen = async (): Promise<void> => {
    if (!editId) return
    try {
      await offertesApi.openPdf(editId)
      toast.success('PDF geopend')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF openen mislukt')
    }
  }

  const handlePdfSaveAs = async (): Promise<void> => {
    if (!editId) return
    try {
      const result = await offertesApi.opslaanPdfAls(editId)
      if (result.saved) toast.success('PDF opgeslagen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto text-center text-gray-500 py-12">Laden...</div>
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-5xl mx-auto space-y-6">
        <OfferteFormHeader
          editId={editId}
          offerteNummer={offerteNummer}
          readOnly={readOnly}
          saving={isSubmitting}
          onPreview={editId ? () => setPreviewOpen(true) : undefined}
          onPdfOpen={editId ? handlePdfOpen : undefined}
          onPdfSaveAs={editId ? handlePdfSaveAs : undefined}
          onMail={editId ? () => setMailModalOpen(true) : undefined}
        />

        <form
          id="offerte-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
          className="space-y-6"
        >
          <BasisgegevensSectie
            klanten={klanten}
            offerteNummer={offerteNummer}
            readOnly={readOnly}
          />

          <DocumentTypeSectie readOnly={readOnly} />

          <RegelsSectie tarieven={tarieven} readOnly={readOnly} title="Offerteregels" />

          <ReistijdSectie
            tarieven={tarieven}
            instellingen={reistijdInstellingen}
            readOnly={readOnly}
          />

          <TotalenSectie instellingen={reistijdInstellingen} totaalLabel="Totaal" />

          <OpmerkingenSectie
            readOnly={readOnly}
            placeholder="Optionele opmerkingen voor op de offerte..."
          />
        </form>
        <PdfPreviewModal
          documentNummer={previewOpen && editId ? offerteNummer : null}
          documentType="Offerte"
          fetchPdfBase64={() =>
            editId ? offertesApi.getPdfBuffer(editId) : Promise.reject(new Error('No editId'))
          }
          onOpenExternal={() =>
            editId ? offertesApi.openPdf(editId).then(() => undefined) : Promise.resolve()
          }
          onSaveAs={() =>
            editId ? offertesApi.opslaanPdfAls(editId).then(() => undefined) : Promise.resolve()
          }
          onClose={() => setPreviewOpen(false)}
        />

        {mailModalOpen && bestaandeOfferte && (
          <OfferteMailVersturenModal
            offerte={bestaandeOfferte}
            onClose={() => setMailModalOpen(false)}
            onSuccess={() => setMailModalOpen(false)}
          />
        )}
      </div>
    </FormProvider>
  )
}
