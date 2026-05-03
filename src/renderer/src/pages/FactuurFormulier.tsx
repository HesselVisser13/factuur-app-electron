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

type FormState = {
  klantId: number | null
  datum: string
  vervalDatum: string
  referentie: string
  opmerkingen: string
  regels: RegelState[]
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

  const [form, setForm] = useState<FormState>({
    klantId: null,
    datum: vandaagIso(),
    vervalDatum: vandaagIso(),
    referentie: '',
    opmerkingen: '',
    regels: []
  })

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
            }))
          })
        } else {
          const nummer = await facturenApi.getNextNummer()
          setFactuurNummer(nummer)

          const termijn = parseInt(instellingen.betaaltermijn_dagen || '14', 10)
          const standaardTarief = tarievenData.find((t) => t.percentage === 21) || tarievenData[0]

          setForm((prev) => ({
            ...prev,
            vervalDatum: voegDagenToe(prev.datum, termijn),
            regels: standaardTarief ? [emptyRegel(standaardTarief)] : []
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
  // Datum gewijzigd → vervaldatum herberekenen (alleen bij nieuw)
  // ============================================================
  async function handleDatumChange(datum: string) {
    setForm((prev) => ({ ...prev, datum }))
    if (!editId) {
      const inst = await instellingenApi.getAll()
      const termijn = parseInt(inst.betaaltermijn_dagen || '14', 10)
      setForm((prev) => ({ ...prev, datum, vervalDatum: voegDagenToe(datum, termijn) }))

      // Factuurnummer eventueel updaten als jaar verandert
      const nieuwNummer = await facturenApi.getNextNummer(datum)
      setFactuurNummer(nieuwNummer)
    }
  }

  // ============================================================
  // Regels manipulatie
  // ============================================================
  function addRegel() {
    const standaardTarief = tarieven.find((t) => t.percentage === 21) || tarieven[0]
    if (!standaardTarief) return
    setForm((prev) => ({
      ...prev,
      regels: [...prev.regels, emptyRegel(standaardTarief)]
    }))
  }

  function removeRegel(index: number) {
    setForm((prev) => ({
      ...prev,
      regels: prev.regels.filter((_, i) => i !== index)
    }))
  }

  function moveRegel(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= form.regels.length) return
    setForm((prev) => {
      const regels = [...prev.regels]
      const tmp = regels[index]
      regels[index] = regels[newIndex]
      regels[newIndex] = tmp
      return { ...prev, regels }
    })
  }

  function updateRegel(index: number, updates: Partial<RegelState>) {
    setForm((prev) => ({
      ...prev,
      regels: prev.regels.map((r, i) => (i === index ? { ...r, ...updates } : r))
    }))
  }

  function updateRegelTarief(index: number, tariefId: number) {
    const tarief = tarieven.find((t) => t.id === tariefId)
    if (!tarief) return
    updateRegel(index, { btwTariefId: tarief.id, btwPercentage: tarief.percentage })
  }

  // ============================================================
  // Totalen (live)
  // ============================================================
  const totalen = useMemo(() => {
    const regelBedragen = form.regels.map(berekenRegel)
    const totaalExcl = regelBedragen.reduce((s, r) => s + r.bedragExcl, 0)
    const totaalBtw = regelBedragen.reduce((s, r) => s + r.btwBedrag, 0)
    const totaalIncl = regelBedragen.reduce((s, r) => s + r.bedragIncl, 0)

    // Splitsing per BTW-tarief
    const perTarief = new Map<number, { over: number; btw: number }>()
    form.regels.forEach((regel, i) => {
      const bedrag = regelBedragen[i]
      const huidig = perTarief.get(regel.btwPercentage) || { over: 0, btw: 0 }
      perTarief.set(regel.btwPercentage, {
        over: huidig.over + bedrag.bedragExcl,
        btw: huidig.btw + bedrag.btwBedrag
      })
    })

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
  }, [form.regels])

  // ============================================================
  // Opslaan
  // ============================================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.klantId) {
      toast.error('Kies een klant')
      return
    }
    if (form.regels.length === 0) {
      toast.error('Voeg minstens één factuurregel toe')
      return
    }

    setSaving(true)
    try {
      const input: FactuurInput = {
        klantId: form.klantId,
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
        }))
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
          {/* PDF-knoppen alleen bij bestaande factuur */}
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

      <form id="factuur-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basisgegevens */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Factuurgegevens
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Klant *</label>
              <select
                required
                disabled={readOnly}
                value={form.klantId ?? ''}
                onChange={(e) =>
                  setForm({ ...form, klantId: parseInt(e.target.value, 10) || null })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50"
              >
                <option value="">-- Kies een klant --</option>
                {klanten.map((k) => (
                  <option key={k.id} value={k.id}>
                    {klantDisplayNaam(k)}
                    {k.plaats ? ` (${k.plaats})` : ''}
                  </option>
                ))}
              </select>
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
                onChange={(e) => setForm({ ...form, referentie: e.target.value })}
                placeholder="bv. inkoopnummer klant"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Factuurdatum *</label>
              <input
                type="date"
                required
                disabled={readOnly}
                value={form.datum}
                onChange={(e) => handleDatumChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Vervaldatum *</label>
              <input
                type="date"
                required
                disabled={readOnly}
                value={form.vervalDatum}
                onChange={(e) => setForm({ ...form, vervalDatum: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50"
              />
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
            <div className="text-center text-gray-500 text-sm py-8">Nog geen regels</div>
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
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                        />
                      </div>

                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs text-gray-500 mb-0.5">Omschrijving</label>
                        <input
                          type="text"
                          required
                          disabled={readOnly}
                          value={regel.omschrijving}
                          onChange={(e) => updateRegel(index, { omschrijving: e.target.value })}
                          placeholder="bv. Installatie warmtepomp"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                        />
                      </div>

                      <div className="col-span-4 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-0.5">Aantal</label>
                        <input
                          type="number"
                          required
                          step="1"
                          min="1"
                          disabled={readOnly}
                          value={regel.aantal}
                          onChange={(e) => updateRegel(index, { aantal: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                        />
                      </div>

                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-0.5">Stuksprijs</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          disabled={readOnly}
                          value={regel.prijsPerStuk}
                          onChange={(e) => updateRegel(index, { prijsPerStuk: e.target.value })}
                          placeholder="0.00"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                        />
                      </div>

                      <div className="col-span-4 md:col-span-1">
                        <label className="block text-xs text-gray-500 mb-0.5">BTW</label>
                        <select
                          disabled={readOnly}
                          value={regel.btwTariefId}
                          onChange={(e) => updateRegelTarief(index, parseInt(e.target.value, 10))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                        >
                          {tarieven.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.percentage}%
                            </option>
                          ))}
                        </select>
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
            onChange={(e) => setForm({ ...form, opmerkingen: e.target.value })}
            rows={3}
            placeholder="Optionele opmerkingen voor op de factuur..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:bg-gray-50"
          />
        </div>
      </form>
      <PdfPreviewModal
        factuurId={previewOpen ? editId : null}
        factuurNummer={factuurNummer}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
