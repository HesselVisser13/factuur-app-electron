// src/renderer/src/pages/FactuurFormulier/FactuurFormulier.ts

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { btwTarievenApi } from '@renderer/api/btw-tarieven'
import { facturenApi } from '@renderer/api/facturen'
import { instellingenApi } from '@renderer/api/instellingen'
import { klantenApi } from '@renderer/api/klanten'
import { PdfPreviewModal } from '@renderer/components/PdfPreviewModal'
import { useToast } from '@renderer/components/Toast'
import {
  datumInputUit,
  isGeldigeDatumString,
  toDatumInput,
  voegDagenToe
} from '@renderer/utils/datum'
import type { BtwTarief, Factuur, Klant } from '@shared/types'
import type { FactuurInput, FactuurRegelInput, ReistijdInput } from '@shared/schemas'
import { MailVersturenModal } from '@renderer/pages/Facturen/components/MailVersturenModal'

import { BasisgegevensSectie } from './components/BasisgegevensSectie'
import { FactuurFormHeader } from './components/FactuurFormHeader'
import { FactuurRegelsSectie } from './components/FactuurRegelsSectie'
import { OpmerkingenSectie } from './components/OpmerkingenSectie'
import { ReistijdSectie } from './components/ReistijdSectie'
import { TotalenSectie } from './components/TotalenSectie'
import {
  FactuurFormSchema,
  type FactuurFormValues,
  type FactuurFormOutput,
  type RegelFormValues
} from './factuurFormSchema'
import { emptyRegel, type ReistijdInstellingen } from './types'

const DEFAULT_BETAALTERMIJN_DAGEN = 14
const STANDAARD_BTW_PERCENTAGE = 21

const initialDefaults: FactuurFormValues = {
  klantId: null,
  datum: toDatumInput(),
  vervalDatum: toDatumInput(),
  referentie: '',
  opmerkingen: '',
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

export function FactuurFormulier() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const editId = params.id ? parseInt(params.id, 10) : null
  const toast = useToast()

  // Server state
  const [klanten, setKlanten] = useState<Klant[]>([])
  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [factuurNummer, setFactuurNummer] = useState('')
  const [bestaandeFactuur, setBestaandeFactuur] = useState<Factuur | null>(null)
  const [betaaltermijn, setBetaaltermijn] = useState(DEFAULT_BETAALTERMIJN_DAGEN)
  const [reistijdInstellingen, setReistijdInstellingen] = useState<ReistijdInstellingen>({
    uurtarief: 0,
    kmtarief: 0
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)

  // RHF
  const methods = useForm<FactuurFormValues, unknown, FactuurFormOutput>({
    resolver: zodResolver(FactuurFormSchema),
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

  const readOnly = bestaandeFactuur !== null && bestaandeFactuur.status !== 'concept'
  const [mailModalOpen, setMailModalOpen] = useState(false)

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
        const termijn = parseInt(
          instellingen.betaaltermijn_dagen || String(DEFAULT_BETAALTERMIJN_DAGEN),
          10
        )

        setKlanten(klantenData)
        setTarieven(tarievenData)
        setReistijdInstellingen({ uurtarief, kmtarief })
        setBetaaltermijn(termijn)

        if (editId) {
          const factuur = await facturenApi.getById(editId)
          if (cancelled) return
          setBestaandeFactuur(factuur)
          setFactuurNummer(factuur.factuurNummer)

          reset({
            klantId: factuur.klantId,
            datum: datumInputUit(factuur.datum),
            vervalDatum: datumInputUit(factuur.vervalDatum),
            referentie: factuur.referentie || '',
            opmerkingen: factuur.opmerkingen || '',
            regels: factuur.regels.map<RegelFormValues>((r) => ({
              _uid: crypto.randomUUID(),
              datum: datumInputUit(r.datum),
              omschrijving: r.omschrijving,
              aantal: String(r.aantal),
              prijsPerStuk: String(r.prijsPerStuk),
              btwTariefId: r.btwTariefId,
              btwPercentage: r.btwPercentage
            })),
            reistijd: {
              enabled: factuur.reistijdUren !== null,
              uren: factuur.reistijdUren !== null ? String(factuur.reistijdUren) : '1',
              km:
                factuur.reistijdKm !== null && factuur.reistijdKm !== undefined
                  ? String(factuur.reistijdKm)
                  : '',
              omschrijving: factuur.reistijdOmschrijving || standaardOms,
              btwTariefId: factuur.reistijdBtwTariefId ?? reisBtwTarief?.id ?? null,
              btwPercentage: factuur.reistijdBtwPercentage ?? reisBtwTarief?.percentage ?? 0
            }
          })
        } else {
          const standaardTarief =
            tarievenData.find((t) => t.percentage === STANDAARD_BTW_PERCENTAGE) || tarievenData[0]

          reset({
            ...initialDefaults,
            vervalDatum: voegDagenToe(initialDefaults.datum, termijn),
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
  // Auto-update vervaldatum + factuurnummer bij datum-wijziging (alleen new)
  // ============================================================
  const datum = watch('datum')

  useEffect(() => {
    if (editId || !isGeldigeDatumString(datum)) return
    setValue('vervalDatum', voegDagenToe(datum, betaaltermijn))
  }, [datum, editId, betaaltermijn, setValue])

  useEffect(() => {
    if (editId || !isGeldigeDatumString(datum)) return
    let cancelled = false
    facturenApi
      .getNextNummer(datum)
      .then((n) => {
        if (!cancelled) setFactuurNummer(n)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [datum, editId])

  // ============================================================
  // Submit
  // ============================================================
  const onSubmit = async (values: FactuurFormOutput) => {
    try {
      const reistijdInput: ReistijdInput | null =
        values.reistijd.enabled && values.reistijd.btwTariefId
          ? {
              uren: parseFloat(values.reistijd.uren) || 0,
              km: values.reistijd.km ? parseFloat(values.reistijd.km) : null,
              btwTariefId: values.reistijd.btwTariefId,
              btwPercentage: values.reistijd.btwPercentage,
              omschrijving: values.reistijd.omschrijving || 'Reistijd'
            }
          : null

      const input: FactuurInput = {
        klantId: values.klantId,
        datum: values.datum,
        vervalDatum: values.vervalDatum,
        referentie: values.referentie || undefined,
        opmerkingen: values.opmerkingen || undefined,
        regels: values.regels.map<FactuurRegelInput>((r) => ({
          datum: r.datum,
          omschrijving: r.omschrijving,
          aantal: parseInt(r.aantal, 10) || 0,
          prijsPerStuk: parseFloat(r.prijsPerStuk) || 0,
          btwTariefId: r.btwTariefId,
          btwPercentage: r.btwPercentage
        })),
        reistijd: reistijdInput
      }

      if (editId) {
        await facturenApi.update({ ...input, id: editId })
        toast.success('Factuur bijgewerkt')
      } else {
        await facturenApi.create(input)
        toast.success('Factuur aangemaakt')
      }
      navigate('/facturen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  const onInvalid = () => {
    toast.error('Controleer de gemarkeerde velden')
  }

  // PDF actions
  const handlePdfOpen = async () => {
    if (!editId) return
    try {
      await facturenApi.openPdf(editId)
      toast.success('PDF geopend')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF openen mislukt')
    }
  }

  const handlePdfSaveAs = async () => {
    if (!editId) return
    try {
      const result = await facturenApi.opslaanPdfAls(editId)
      if (result.saved) toast.success('PDF opgeslagen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Laden...</div>
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <FactuurFormHeader
          editId={editId}
          factuurNummer={factuurNummer}
          readOnly={readOnly}
          saving={isSubmitting}
          onPreview={() => setPreviewOpen(true)}
          onPdfOpen={handlePdfOpen}
          onPdfSaveAs={handlePdfSaveAs}
          onMail={editId ? () => setMailModalOpen(true) : undefined}
        />

        <form
          id="factuur-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
          className="space-y-6"
        >
          <BasisgegevensSectie
            klanten={klanten}
            factuurNummer={factuurNummer}
            readOnly={readOnly}
          />

          <FactuurRegelsSectie tarieven={tarieven} readOnly={readOnly} />

          <ReistijdSectie
            tarieven={tarieven}
            instellingen={reistijdInstellingen}
            readOnly={readOnly}
          />

          <TotalenSectie instellingen={reistijdInstellingen} />

          <OpmerkingenSectie readOnly={readOnly} />
        </form>

        <PdfPreviewModal
          factuurId={previewOpen ? editId : null}
          factuurNummer={factuurNummer}
          onClose={() => setPreviewOpen(false)}
        />
        {mailModalOpen && bestaandeFactuur && (
          <MailVersturenModal
            factuur={bestaandeFactuur}
            onClose={() => setMailModalOpen(false)}
            onSuccess={() => setMailModalOpen(false)}
          />
        )}
      </div>
    </FormProvider>
  )
}
