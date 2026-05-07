// src/renderer/src/pages/FactuurFormulier.tsx

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { facturenApi } from '../api/facturen'
import { klantenApi } from '../api/klanten'
import { btwTarievenApi } from '../api/btw-tarieven'
import { instellingenApi } from '../api/instellingen'
import type { Factuur, Klant, BtwTarief } from '../../../shared/types'
import type { FactuurInput, FactuurRegelInput } from '../../../shared/schemas'
import { klantDisplayNaam } from '../../../shared/klant-utils'
import { formatCurrency } from '../utils/formatters'
import { useToast } from '../components/Toast'
import { PdfPreviewModal } from '../components/PdfPreviewModal'
import type { ReistijdInput } from '../../../shared/schemas'

// ============================================================
// Helpers
// ============================================================

function vandaagIso(): string {
  return new Date().toISOString().substring(0, 10)
}

function voegDagenToe(isoDatum: string, dagen: number): string {
  const d = new Date(isoDatum)
  d.setDate(d.getDate() + dagen)
  return d.toISOString().substring(0, 10)
}

function berekenRegel(regel: RegelState) {
  const aantal = parseFloat(regel.aantal) || 0
  const prijs = parseFloat(regel.prijsPerStuk) || 0
  const btwPct = regel.btwPercentage
  const bedragExcl = aantal * prijs
  const btwBedrag = bedragExcl * (btwPct / 100)
  const bedragIncl = bedragExcl + btwBedrag
  return {
    bedragExcl: Math.round(bedragExcl * 100) / 100,
    btwBedrag: Math.round(btwBedrag * 100) / 100,
    bedragIncl: Math.round(bedragIncl * 100) / 100
  }
}

function isGeldigeDatumString(s: string): boolean {
  if (!s) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return !isNaN(new Date(s).getTime())
}

// ============================================================
// State types
// ============================================================

type RegelState = {
  datum: string
  omschrijving: string
  aantal: string
  prijsPerStuk: string
  btwTariefId: number
  btwPercentage: number
}

type ReistijdState = {
  enabled: boolean
  uren: string
  km: string
  omschrijving: string
  btwTariefId: number | null
  btwPercentage: number
}

type FormState = {
  klantId: number | null
  datum: string
  vervalDatum: string
  referentie: string
  opmerkingen: string
  regels: RegelState[]
  reistijd: ReistijdState
}

type RegelErrors = Partial<Record<keyof RegelState, string>>
type ReistijdErrors = Partial<Record<keyof ReistijdState, string>>

type FormErrors = {
  klantId?: string
  datum?: string
  vervalDatum?: string
  referentie?: string
  opmerkingen?: string
  regels?: RegelErrors[]
  reistijd?: ReistijdErrors
}

type RegelTouched = Partial<Record<keyof RegelState, boolean>>
type ReistijdTouched = Partial<Record<keyof ReistijdState, boolean>>

type FormTouched = {
  klantId?: boolean
  datum?: boolean
  vervalDatum?: boolean
  referentie?: boolean
  opmerkingen?: boolean
  regels?: RegelTouched[]
  reistijd?: ReistijdTouched
}

function emptyRegel(tarief: BtwTarief): RegelState {
  return {
    datum: vandaagIso(),
    omschrijving: '',
    aantal: '1',
    prijsPerStuk: '',
    btwTariefId: tarief.id,
    btwPercentage: tarief.percentage
  }
}

// ============================================================
// Validatie
// ============================================================

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  // Klant
  if (!form.klantId) {
    errors.klantId = 'Kies een klant'
  }

  // Datum
  if (!form.datum) {
    errors.datum = 'Factuurdatum is verplicht'
  } else if (!isGeldigeDatumString(form.datum)) {
    errors.datum = 'Ongeldige datum'
  }

  // Vervaldatum
  if (!form.vervalDatum) {
    errors.vervalDatum = 'Vervaldatum is verplicht'
  } else if (!isGeldigeDatumString(form.vervalDatum)) {
    errors.vervalDatum = 'Ongeldige datum'
  } else if (
    isGeldigeDatumString(form.datum) &&
    new Date(form.vervalDatum) < new Date(form.datum)
  ) {
    errors.vervalDatum = 'Vervaldatum moet op of na de factuurdatum zijn'
  }

  // Referentie & opmerkingen (alleen max-length)
  if (form.referentie && form.referentie.length > 100) {
    errors.referentie = 'Max 100 tekens'
  }
  if (form.opmerkingen && form.opmerkingen.length > 1000) {
    errors.opmerkingen = 'Max 1000 tekens'
  }

  // Regels
  if (form.regels.length > 0) {
    const regelErrors: RegelErrors[] = []
    let hasError = false

    form.regels.forEach((regel, i) => {
      const re: RegelErrors = {}

      if (!regel.omschrijving || !regel.omschrijving.trim()) {
        re.omschrijving = 'Verplicht'
      } else if (regel.omschrijving.length > 500) {
        re.omschrijving = 'Max 500 tekens'
      }

      if (!regel.aantal) {
        re.aantal = 'Vereist'
      } else if (!/^\d+$/.test(regel.aantal)) {
        re.aantal = 'Heel getal'
      } else {
        const aantal = parseInt(regel.aantal, 10)
        if (aantal <= 0) re.aantal = 'Min 1'
        else if (aantal > 10_000) re.aantal = 'Max 10.000'
      }

      if (regel.prijsPerStuk === '') {
        re.prijsPerStuk = 'Vereist'
      } else {
        const prijs = parseFloat(regel.prijsPerStuk)
        if (isNaN(prijs)) re.prijsPerStuk = 'Geen getal'
        else if (prijs < 0) re.prijsPerStuk = 'Niet negatief'
        else if (prijs > 1_000_000) re.prijsPerStuk = 'Te hoog'
      }

      if (!regel.datum) {
        re.datum = 'Vereist'
      } else if (!isGeldigeDatumString(regel.datum)) {
        re.datum = 'Ongeldig'
      }

      if (!regel.btwTariefId) {
        re.btwTariefId = 'Kies tarief'
      }

      regelErrors[i] = re
      if (Object.keys(re).length > 0) hasError = true
    })

    if (hasError) errors.regels = regelErrors
  }

  // Reistijd (alleen als enabled)
  if (form.reistijd.enabled) {
    const re: ReistijdErrors = {}

    if (!form.reistijd.uren) {
      re.uren = 'Reistijd is verplicht'
    } else {
      const uren = parseFloat(form.reistijd.uren)
      if (isNaN(uren)) re.uren = 'Geen geldig getal'
      else if (uren < 0.5) re.uren = 'Minimaal 0,5 uur'
      else if (uren > 24) re.uren = 'Maximaal 24 uur'
    }

    if (form.reistijd.km) {
      const km = parseFloat(form.reistijd.km)
      if (isNaN(km)) re.km = 'Geen geldig getal'
      else if (km < 0) re.km = 'Niet negatief'
      else if (km > 10_000) re.km = 'Maximaal 10.000 km'
    }

    if (!form.reistijd.omschrijving || !form.reistijd.omschrijving.trim()) {
      re.omschrijving = 'Omschrijving is verplicht'
    } else if (form.reistijd.omschrijving.length > 200) {
      re.omschrijving = 'Maximaal 200 tekens'
    }

    if (!form.reistijd.btwTariefId) {
      re.btwTariefId = 'Kies een BTW-tarief'
    }

    if (Object.keys(re).length > 0) errors.reistijd = re
  }

  return errors
}

function heeftErrors(errors: FormErrors): boolean {
  if (errors.klantId || errors.datum || errors.vervalDatum) return true
  if (errors.referentie || errors.opmerkingen) return true
  if (errors.regels && errors.regels.some((r) => Object.keys(r).length > 0)) return true
  if (errors.reistijd && Object.keys(errors.reistijd).length > 0) return true
  return false
}

// ============================================================
// Component
// ============================================================

export function FactuurFormulier() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const editId = params.id ? parseInt(params.id, 10) : null

  const [klanten, setKlanten] = useState<Klant[]>([])
  const [tarieven, setTarieven] = useState<BtwTarief[]>([])
  const [factuurNummer, setFactuurNummer] = useState<string>('')
  const [bestaandeFactuur, setBestaandeFactuur] = useState<Factuur | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [reistijdInstellingen, setReistijdInstellingen] = useState({
    uurtarief: 0,
    kmtarief: 0
  })

  const [form, setForm] = useState<FormState>({
    klantId: null,
    datum: vandaagIso(),
    vervalDatum: vandaagIso(),
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
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<FormTouched>({})

  const readOnly = bestaandeFactuur !== null && bestaandeFactuur.status !== 'concept'

  // ============================================================
  // Initiele data laden
  // ============================================================
  useEffect(() => {
    ;(async () => {
      try {
        const [klantenData, tarievenData, instellingen] = await Promise.all([
          klantenApi.getAll(),
          btwTarievenApi.getActief(),
          instellingenApi.getAll()
        ])
        setKlanten(klantenData)
        setTarieven(tarievenData)
        const uurtarief = parseFloat(instellingen.reiskosten_uurtarief || '0') || 0
        const kmtarief = parseFloat(instellingen.reiskosten_kmtarief || '0') || 0
        const standaardOms = instellingen.reiskosten_omschrijving || 'Reistijd'
        const reisBtwTariefId = parseInt(instellingen.reiskosten_btw_tarief_id || '0', 10) || null
        const reisBtwTarief =
          (reisBtwTariefId && tarievenData.find((t) => t.id === reisBtwTariefId)) || null

        setReistijdInstellingen({ uurtarief, kmtarief })

        if (editId) {
          const factuur = await facturenApi.getById(editId)
          setBestaandeFactuur(factuur)
          setFactuurNummer(factuur.factuurNummer)
          setForm({
            klantId: factuur.klantId,
            datum: factuur.datum.substring(0, 10),
            vervalDatum: factuur.vervalDatum.substring(0, 10),
            referentie: factuur.referentie || '',
            opmerkingen: factuur.opmerkingen || '',
            regels: factuur.regels.map((r) => ({
              datum: r.datum.substring(0, 10),
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
          const nummer = await facturenApi.getNextNummer()
          setFactuurNummer(nummer)

          const termijn = parseInt(instellingen.betaaltermijn_dagen || '14', 10)
          const standaardTarief = tarievenData.find((t) => t.percentage === 21) || tarievenData[0]

          setForm((prev) => ({
            ...prev,
            vervalDatum: voegDagenToe(prev.datum, termijn),
            regels: standaardTarief ? [emptyRegel(standaardTarief)] : [],
            reistijd: {
              ...prev.reistijd,
              omschrijving: standaardOms,
              btwTariefId: reisBtwTarief?.id ?? standaardTarief?.id ?? null,
              btwPercentage: reisBtwTarief?.percentage ?? standaardTarief?.percentage ?? 0
            }
          }))
        }
      } catch (err) {
        toast.error('Fout bij laden: ' + (err instanceof Error ? err.message : 'onbekend'))
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  // ============================================================
  // State updaters met live validatie
  // ============================================================

  function applyForm(newForm: FormState) {
    setForm(newForm)
    setErrors(validateForm(newForm))
  }

  async function handleDatumChange(datum: string) {
    if (!editId) {
      const inst = await instellingenApi.getAll()
      const termijn = parseInt(inst.betaaltermijn_dagen || '14', 10)
      const newForm = { ...form, datum, vervalDatum: voegDagenToe(datum, termijn) }
      applyForm(newForm)

      const nieuwNummer = await facturenApi.getNextNummer(datum)
      setFactuurNummer(nieuwNummer)
    } else {
      applyForm({ ...form, datum })
    }
  }

  function addRegel() {
    const standaardTarief = tarieven.find((t) => t.percentage === 21) || tarieven[0]
    if (!standaardTarief) return
    applyForm({ ...form, regels: [...form.regels, emptyRegel(standaardTarief)] })
  }

  function removeRegel(index: number) {
    const newRegels = form.regels.filter((_, i) => i !== index)
    applyForm({ ...form, regels: newRegels })
    // Touched ook bijwerken
    if (touched.regels) {
      setTouched({
        ...touched,
        regels: touched.regels.filter((_, i) => i !== index)
      })
    }
  }

  function moveRegel(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= form.regels.length) return
    const regels = [...form.regels]
    const tmp = regels[index]
    regels[index] = regels[newIndex]
    regels[newIndex] = tmp
    applyForm({ ...form, regels })
  }

  function updateRegel(index: number, updates: Partial<RegelState>) {
    const regels = form.regels.map((r, i) => (i === index ? { ...r, ...updates } : r))
    applyForm({ ...form, regels })
  }

  function updateRegelTarief(index: number, tariefId: number) {
    const tarief = tarieven.find((t) => t.id === tariefId)
    if (!tarief) return
    updateRegel(index, { btwTariefId: tarief.id, btwPercentage: tarief.percentage })
  }

  function updateReistijd(updates: Partial<ReistijdState>) {
    applyForm({ ...form, reistijd: { ...form.reistijd, ...updates } })
  }

  function updateReistijdTarief(tariefId: number) {
    const tarief = tarieven.find((t) => t.id === tariefId)
    if (!tarief) return
    updateReistijd({ btwTariefId: tarief.id, btwPercentage: tarief.percentage })
  }

  // ============================================================
  // Touched-handlers
  // ============================================================

  function touchField(key: 'klantId' | 'datum' | 'vervalDatum' | 'referentie' | 'opmerkingen') {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  function touchRegelField(index: number, key: keyof RegelState) {
    setTouched((prev) => {
      const regels = [...(prev.regels || [])]
      regels[index] = { ...(regels[index] || {}), [key]: true }
      return { ...prev, regels }
    })
  }

  function touchReistijdField(key: keyof ReistijdState) {
    setTouched((prev) => ({
      ...prev,
      reistijd: { ...(prev.reistijd || {}), [key]: true }
    }))
  }

  // ============================================================
  // Class & message helpers
  // ============================================================

  function inputClasses(field: 'klantId' | 'datum' | 'vervalDatum' | 'referentie'): string {
    const base = 'w-full border rounded-lg px-4 py-2 text-sm disabled:bg-gray-50'
    const showError = touched[field] && errors[field]
    return `${base} ${showError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`
  }

  function fieldErrorMessage(
    field: 'klantId' | 'datum' | 'vervalDatum' | 'referentie' | 'opmerkingen'
  ) {
    const showError = touched[field] && errors[field]
    if (!showError) return null
    return <p className="text-xs text-red-600 mt-1">{errors[field]}</p>
  }

  function regelInputClasses(index: number, field: keyof RegelState): string {
    const base = 'w-full border rounded px-2 py-1 text-sm disabled:bg-gray-100'
    const showError = touched.regels?.[index]?.[field] && errors.regels?.[index]?.[field]
    return `${base} ${showError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`
  }

  function regelErrorMessage(index: number, field: keyof RegelState) {
    const showError = touched.regels?.[index]?.[field] && errors.regels?.[index]?.[field]
    if (!showError) return null
    return <p className="text-xs text-red-600 mt-0.5">{errors.regels![index][field]}</p>
  }

  function reistijdInputClasses(field: keyof ReistijdState): string {
    const base = 'w-full border rounded-lg px-4 py-2 text-sm disabled:bg-gray-50'
    const showError = touched.reistijd?.[field] && errors.reistijd?.[field]
    return `${base} ${showError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`
  }

  function reistijdErrorMessage(field: keyof ReistijdState) {
    const showError = touched.reistijd?.[field] && errors.reistijd?.[field]
    if (!showError) return null
    return <p className="text-xs text-red-600 mt-1">{errors.reistijd![field]}</p>
  }

  // ============================================================
  // Reistijd & totalen berekening
  // ============================================================

  const reistijdBedrag = useMemo(() => {
    if (!form.reistijd.enabled) {
      return { excl: 0, btw: 0, incl: 0 }
    }
    const uren = parseFloat(form.reistijd.uren) || 0
    const km = parseFloat(form.reistijd.km) || 0
    const excl =
      Math.round(
        (uren * reistijdInstellingen.uurtarief + km * reistijdInstellingen.kmtarief) * 100
      ) / 100
    const btw = Math.round(((excl * form.reistijd.btwPercentage) / 100) * 100) / 100
    return {
      excl,
      btw,
      incl: Math.round((excl + btw) * 100) / 100
    }
  }, [form.reistijd, reistijdInstellingen])

  const totalen = useMemo(() => {
    const regelBedragen = form.regels.map(berekenRegel)
    let totaalExcl = regelBedragen.reduce((s, r) => s + r.bedragExcl, 0)
    let totaalBtw = regelBedragen.reduce((s, r) => s + r.btwBedrag, 0)
    let totaalIncl = regelBedragen.reduce((s, r) => s + r.bedragIncl, 0)

    const perTarief = new Map<number, { over: number; btw: number }>()
    form.regels.forEach((regel, i) => {
      const bedrag = regelBedragen[i]
      const huidig = perTarief.get(regel.btwPercentage) || { over: 0, btw: 0 }
      perTarief.set(regel.btwPercentage, {
        over: huidig.over + bedrag.bedragExcl,
        btw: huidig.btw + bedrag.btwBedrag
      })
    })

    if (form.reistijd.enabled && reistijdBedrag.excl > 0) {
      totaalExcl += reistijdBedrag.excl
      totaalBtw += reistijdBedrag.btw
      totaalIncl += reistijdBedrag.incl

      const huidig = perTarief.get(form.reistijd.btwPercentage) || { over: 0, btw: 0 }
      perTarief.set(form.reistijd.btwPercentage, {
        over: huidig.over + reistijdBedrag.excl,
        btw: huidig.btw + reistijdBedrag.btw
      })
    }

    return {
      totaalExcl: Math.round(totaalExcl * 100) / 100,
      totaalBtw: Math.round(totaalBtw * 100) / 100,
      totaalIncl: Math.round(totaalIncl * 100) / 100,
      perTarief: Array.from(perTarief.entries())
        .map(([pct, b]) => ({
          percentage: pct,
          over: Math.round(b.over * 100) / 100,
          btw: Math.round(b.btw * 100) / 100
        }))
        .sort((a, b) => a.percentage - b.percentage)
    }
  }, [form.regels, form.reistijd, reistijdBedrag])

  // ============================================================
  // Submit
  // ============================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Markeer alles als touched
    setTouched({
      klantId: true,
      datum: true,
      vervalDatum: true,
      referentie: true,
      opmerkingen: true,
      regels: form.regels.map(() => ({
        datum: true,
        omschrijving: true,
        aantal: true,
        prijsPerStuk: true,
        btwTariefId: true
      })),
      reistijd: {
        uren: true,
        km: true,
        omschrijving: true,
        btwTariefId: true
      }
    })

    const formErrors = validateForm(form)
    setErrors(formErrors)

    if (form.regels.length === 0) {
      toast.error('Voeg minstens één factuurregel toe')
      return
    }

    if (heeftErrors(formErrors)) {
      toast.error('Controleer de gemarkeerde velden')
      return
    }

    setSaving(true)
    try {
      const reistijdInput: ReistijdInput | null =
        form.reistijd.enabled && form.reistijd.btwTariefId
          ? {
              uren: parseFloat(form.reistijd.uren) || 0,
              km: form.reistijd.km ? parseFloat(form.reistijd.km) : null,
              btwTariefId: form.reistijd.btwTariefId,
              btwPercentage: form.reistijd.btwPercentage,
              omschrijving: form.reistijd.omschrijving || 'Reistijd'
            }
          : null

      const input: FactuurInput = {
        klantId: form.klantId!,
        datum: form.datum,
        vervalDatum: form.vervalDatum,
        referentie: form.referentie || undefined,
        opmerkingen: form.opmerkingen || undefined,
        regels: form.regels.map<FactuurRegelInput>((r) => ({
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
    } finally {
      setSaving(false)
    }
  }

  async function handlePdfOpen() {
    if (!editId) return
    try {
      await facturenApi.openPdf(editId)
      toast.success('PDF geopend')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF openen mislukt')
    }
  }

  async function handlePdfSaveAs() {
    if (!editId) return
    try {
      const result = await facturenApi.opslaanPdfAls(editId)
      if (result.saved) {
        toast.success('PDF opgeslagen')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  // Banner: alleen bij touched fouten
  const heeftZichtbareErrors = (() => {
    if (touched.klantId && errors.klantId) return true
    if (touched.datum && errors.datum) return true
    if (touched.vervalDatum && errors.vervalDatum) return true
    if (touched.referentie && errors.referentie) return true
    if (touched.opmerkingen && errors.opmerkingen) return true
    if (errors.regels && touched.regels) {
      for (let i = 0; i < errors.regels.length; i++) {
        const re = errors.regels[i]
        const tr = touched.regels[i] || {}
        for (const key of Object.keys(re)) {
          if (tr[key as keyof RegelState]) return true
        }
      }
    }
    if (errors.reistijd && touched.reistijd) {
      for (const key of Object.keys(errors.reistijd)) {
        if (touched.reistijd[key as keyof ReistijdState]) return true
      }
    }
    return false
  })()

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Laden...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/facturen')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            ← Terug naar facturen
          </button>
          <h1 className="text-2xl font-bold">
            {editId
              ? `Factuur ${factuurNummer}${readOnly ? ' (alleen lezen)' : ''}`
              : 'Nieuwe factuur'}
          </h1>
        </div>
        <div className="flex gap-2">
          {editId && (
            <>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm"
              >
                👁️ Voorbeeld
              </button>
              <button
                type="button"
                onClick={handlePdfOpen}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm"
              >
                📄 PDF
              </button>
              <button
                type="button"
                onClick={handlePdfSaveAs}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm"
              >
                💾 Opslaan als...
              </button>
            </>
          )}

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => navigate('/facturen')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Annuleren
              </button>
              <button
                type="submit"
                form="factuur-form"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : editId ? 'Bijwerken' : 'Factuur opslaan'}
              </button>
            </>
          )}
        </div>
      </div>

      <form id="factuur-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Basisgegevens */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Factuurgegevens
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Klant *</label>
              <select
                disabled={readOnly}
                value={form.klantId ?? ''}
                onChange={(e) =>
                  applyForm({ ...form, klantId: parseInt(e.target.value, 10) || null })
                }
                onBlur={() => touchField('klantId')}
                className={inputClasses('klantId')}
              >
                <option value="">-- Kies een klant --</option>
                {klanten.map((k) => (
                  <option key={k.id} value={k.id}>
                    {klantDisplayNaam(k)}
                    {k.plaats ? ` (${k.plaats})` : ''}
                  </option>
                ))}
              </select>
              {fieldErrorMessage('klantId')}
              {klanten.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Geen klanten gevonden.{' '}
                  <button type="button" onClick={() => navigate('/klanten')} className="underline">
                    Maak eerst een klant aan
                  </button>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Factuurnummer</label>
              <input
                type="text"
                disabled
                value={factuurNummer}
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Referentie</label>
              <input
                type="text"
                disabled={readOnly}
                value={form.referentie}
                onChange={(e) => applyForm({ ...form, referentie: e.target.value })}
                onBlur={() => touchField('referentie')}
                placeholder="bv. inkoopnummer klant"
                className={inputClasses('referentie')}
              />
              {fieldErrorMessage('referentie')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Factuurdatum *</label>
              <input
                type="date"
                disabled={readOnly}
                value={form.datum}
                onChange={(e) => handleDatumChange(e.target.value)}
                onBlur={() => touchField('datum')}
                className={inputClasses('datum')}
              />
              {fieldErrorMessage('datum')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Vervaldatum *</label>
              <input
                type="date"
                disabled={readOnly}
                value={form.vervalDatum}
                onChange={(e) => applyForm({ ...form, vervalDatum: e.target.value })}
                onBlur={() => touchField('vervalDatum')}
                className={inputClasses('vervalDatum')}
              />
              {fieldErrorMessage('vervalDatum')}
            </div>
          </div>
        </div>

        {/* Regels */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Factuurregels
            </h2>
            {!readOnly && (
              <button
                type="button"
                onClick={addRegel}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Regel toevoegen
              </button>
            )}
          </div>

          {form.regels.length === 0 ? (
            <div className="text-center text-red-600 text-sm py-8 bg-red-50 border border-red-200 rounded-lg">
              ⚠️ Voeg minstens één factuurregel toe
            </div>
          ) : (
            <div className="space-y-2">
              {form.regels.map((regel, index) => {
                const bedragen = berekenRegel(regel)
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
                  >
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-0.5">Datum</label>
                        <input
                          type="date"
                          disabled={readOnly}
                          value={regel.datum}
                          onChange={(e) => updateRegel(index, { datum: e.target.value })}
                          onBlur={() => touchRegelField(index, 'datum')}
                          className={regelInputClasses(index, 'datum')}
                        />
                        {regelErrorMessage(index, 'datum')}
                      </div>

                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs text-gray-500 mb-0.5">Omschrijving</label>
                        <input
                          type="text"
                          disabled={readOnly}
                          value={regel.omschrijving}
                          onChange={(e) => updateRegel(index, { omschrijving: e.target.value })}
                          onBlur={() => touchRegelField(index, 'omschrijving')}
                          placeholder="bv. Installatie warmtepomp"
                          className={regelInputClasses(index, 'omschrijving')}
                        />
                        {regelErrorMessage(index, 'omschrijving')}
                      </div>

                      <div className="col-span-4 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-0.5">Aantal</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          disabled={readOnly}
                          value={regel.aantal}
                          onChange={(e) => updateRegel(index, { aantal: e.target.value })}
                          onBlur={() => touchRegelField(index, 'aantal')}
                          className={regelInputClasses(index, 'aantal')}
                        />
                        {regelErrorMessage(index, 'aantal')}
                      </div>

                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-0.5">Stuksprijs</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={readOnly}
                          value={regel.prijsPerStuk}
                          onChange={(e) => updateRegel(index, { prijsPerStuk: e.target.value })}
                          onBlur={() => touchRegelField(index, 'prijsPerStuk')}
                          placeholder="0.00"
                          className={regelInputClasses(index, 'prijsPerStuk')}
                        />
                        {regelErrorMessage(index, 'prijsPerStuk')}
                      </div>

                      <div className="col-span-4 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-0.5">BTW</label>
                        <select
                          disabled={readOnly}
                          value={regel.btwTariefId}
                          onChange={(e) => updateRegelTarief(index, parseInt(e.target.value, 10))}
                          onBlur={() => touchRegelField(index, 'btwTariefId')}
                          className={regelInputClasses(index, 'btwTariefId')}
                        >
                          {tarieven.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.percentage}%
                            </option>
                          ))}
                        </select>
                        {regelErrorMessage(index, 'btwTariefId')}
                      </div>

                      <div className="col-span-12 md:col-span-2 flex items-end">
                        <div className="w-full text-right font-medium text-sm py-1">
                          {formatCurrency(bedragen.bedragIncl)}
                        </div>
                      </div>
                    </div>

                    {!readOnly && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-500">
                          Excl: {formatCurrency(bedragen.bedragExcl)} · BTW:{' '}
                          {formatCurrency(bedragen.btwBedrag)}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveRegel(index, -1)}
                            disabled={index === 0}
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRegel(index, 1)}
                            disabled={index === form.regels.length - 1}
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRegel(index)}
                            className="px-2 py-0.5 text-red-600 hover:bg-red-100 rounded"
                          >
                            Verwijder
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reistijd */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">🚗 Reistijd</h2>
            {!readOnly && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reistijd.enabled}
                  onChange={(e) => updateReistijd({ enabled: e.target.checked })}
                  className="rounded"
                />
                Reistijd toepassen
              </label>
            )}
          </div>

          {form.reistijd.enabled ? (
            <>
              {reistijdInstellingen.uurtarief === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4">
                  ⚠️ Er is nog geen uurtarief voor reistijd ingesteld. Ga naar{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/instellingen')}
                    className="underline font-medium"
                  >
                    Instellingen → Reiskosten
                  </button>{' '}
                  om dit in te stellen.
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Reistijd (uur)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    disabled={readOnly}
                    value={form.reistijd.uren}
                    onChange={(e) => updateReistijd({ uren: e.target.value })}
                    onBlur={() => touchReistijdField('uren')}
                    className={reistijdInputClasses('uren')}
                  />
                  {reistijdErrorMessage('uren')}
                  {reistijdInstellingen.uurtarief > 0 && !errors.reistijd?.uren && (
                    <p className="text-xs text-gray-500 mt-1">
                      {form.reistijd.uren || '0'} × {formatCurrency(reistijdInstellingen.uurtarief)}{' '}
                      ={' '}
                      {formatCurrency(
                        (parseFloat(form.reistijd.uren) || 0) * reistijdInstellingen.uurtarief
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Kilometers <span className="text-gray-400 font-normal">— optioneel</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={readOnly || reistijdInstellingen.kmtarief === 0}
                    value={form.reistijd.km}
                    onChange={(e) => updateReistijd({ km: e.target.value })}
                    onBlur={() => touchReistijdField('km')}
                    placeholder={
                      reistijdInstellingen.kmtarief > 0 ? '0' : 'Geen km-tarief ingesteld'
                    }
                    className={reistijdInputClasses('km')}
                  />
                  {reistijdErrorMessage('km')}
                  {reistijdInstellingen.kmtarief > 0 &&
                    form.reistijd.km &&
                    !errors.reistijd?.km && (
                      <p className="text-xs text-gray-500 mt-1">
                        {form.reistijd.km} × {formatCurrency(reistijdInstellingen.kmtarief)} ={' '}
                        {formatCurrency(
                          (parseFloat(form.reistijd.km) || 0) * reistijdInstellingen.kmtarief
                        )}
                      </p>
                    )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Omschrijving
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={form.reistijd.omschrijving}
                    onChange={(e) => updateReistijd({ omschrijving: e.target.value })}
                    onBlur={() => touchReistijdField('omschrijving')}
                    className={reistijdInputClasses('omschrijving')}
                  />
                  {reistijdErrorMessage('omschrijving')}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">BTW-tarief</label>
                  <select
                    disabled={readOnly}
                    value={form.reistijd.btwTariefId ?? ''}
                    onChange={(e) => updateReistijdTarief(parseInt(e.target.value, 10))}
                    onBlur={() => touchReistijdField('btwTariefId')}
                    className={reistijdInputClasses('btwTariefId')}
                  >
                    <option value="">-- Kies tarief --</option>
                    {tarieven.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.naam} ({t.percentage}%)
                      </option>
                    ))}
                  </select>
                  {reistijdErrorMessage('btwTariefId')}
                </div>

                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotaal excl. BTW</span>
                    <span className="font-medium">{formatCurrency(reistijdBedrag.excl)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>BTW {form.reistijd.btwPercentage}%</span>
                    <span>{formatCurrency(reistijdBedrag.btw)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-blue-200">
                    <span>Totaal incl. BTW</span>
                    <span>{formatCurrency(reistijdBedrag.incl)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Vink &quot;Reistijd toepassen&quot; aan om reistijd toe te voegen aan deze factuur.
            </p>
          )}
        </div>

        {/* Totalen */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Totalen</h2>

          <div className="space-y-2 max-w-md ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Totaal excl. BTW</span>
              <span className="font-medium">{formatCurrency(totalen.totaalExcl)}</span>
            </div>

            {totalen.perTarief.length > 0 && (
              <div className="border-t border-gray-100 pt-2 space-y-1">
                {totalen.perTarief.map((t) => (
                  <div key={t.percentage} className="flex justify-between text-xs text-gray-500">
                    <span>
                      BTW {t.percentage}% over {formatCurrency(t.over)}
                    </span>
                    <span>{formatCurrency(t.btw)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
              <span className="text-gray-600">Totaal BTW</span>
              <span className="font-medium">{formatCurrency(totalen.totaalBtw)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2">
              <span>Te betalen</span>
              <span>{formatCurrency(totalen.totaalIncl)}</span>
            </div>
          </div>
        </div>

        {/* Opmerkingen */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Opmerkingen
          </h2>
          <textarea
            disabled={readOnly}
            value={form.opmerkingen}
            onChange={(e) => applyForm({ ...form, opmerkingen: e.target.value })}
            onBlur={() => touchField('opmerkingen')}
            rows={3}
            placeholder="Optionele opmerkingen voor op de factuur..."
            className={
              touched.opmerkingen && errors.opmerkingen
                ? 'w-full border border-red-500 bg-red-50 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50'
                : 'w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50'
            }
          />
          {fieldErrorMessage('opmerkingen')}
        </div>

        {/* Banner met fout-overzicht */}
        {heeftZichtbareErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Er zijn nog fouten in het formulier. Controleer de gemarkeerde velden.
          </div>
        )}
      </form>

      <PdfPreviewModal
        factuurId={previewOpen ? editId : null}
        factuurNummer={factuurNummer}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
