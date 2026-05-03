// src/renderer/src/pages/Facturen.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { facturenApi } from '../api/facturen'
import type { Factuur } from '../../../shared/types'
import type { FactuurStatus } from '../../../shared/schemas'
import { klantDisplayNaam } from '../../../shared/klant-utils'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmDialog'
import { PdfPreviewModal } from '../components/PdfPreviewModal'

// ============================================================
// Helpers
// ============================================================

function isVervallen(factuur: Factuur): boolean {
  if (factuur.status !== 'verstuurd') return false
  return new Date(factuur.vervalDatum) < new Date()
}

const statusConfig: Record<FactuurStatus, { label: string; classes: string; icon: string }> = {
  concept: {
    label: 'Concept',
    classes: 'bg-gray-100 text-gray-700',
    icon: '📝'
  },
  verstuurd: {
    label: 'Verstuurd',
    classes: 'bg-blue-100 text-blue-700',
    icon: '📤'
  },
  betaald: {
    label: 'Betaald',
    classes: 'bg-green-100 text-green-700',
    icon: '✅'
  },
  geannuleerd: {
    label: 'Geannuleerd',
    classes: 'bg-red-100 text-red-700 line-through',
    icon: '🚫'
  }
}

// ============================================================
// Component
// ============================================================

type StatusFilter = 'alle' | FactuurStatus

export function Facturen() {
  const navigate = useNavigate()
  const [facturen, setFacturen] = useState<Factuur[]>([])
  const [zoek, setZoek] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const confirm = useConfirm()
  const [previewFactuur, setPreviewFactuur] = useState<Factuur | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await facturenApi.getAll()
      setFacturen(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleStatusChange(f: Factuur, nieuwStatus: FactuurStatus) {
    if (nieuwStatus === 'geannuleerd') {
      const ok = await confirm({
        title: 'Factuur annuleren',
        message: `Weet je zeker dat je factuur ${f.factuurNummer} wilt annuleren? Dit haalt ook de gekoppelde transacties weg.`,
        variant: 'danger',
        confirmText: 'Ja, factuur annuleren'
      })
      if (!ok) return
    }
    try {
      await facturenApi.updateStatus(f.id, nieuwStatus)
      await load()
      toast.success(`Status bijgewerkt naar ${nieuwStatus}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  async function handleDelete(f: Factuur) {
    const ok = await confirm({
      title: 'Factuur verwijderen',
      message: `Weet je zeker dat je factuur ${f.factuurNummer} wilt verwijderen?`,
      variant: 'danger',
      confirmText: 'Verwijderen'
    })
    if (!ok) return
    try {
      await facturenApi.delete(f.id)
      await load()
      toast.success('Factuur verwijderd')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    }
  }

  async function handlePdfOpen(f: Factuur) {
    try {
      await facturenApi.openPdf(f.id)
      toast.success(`PDF geopend voor factuur ${f.factuurNummer}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF openen mislukt')
    }
  }

  async function handlePdfSaveAs(f: Factuur) {
    try {
      const result = await facturenApi.opslaanPdfAls(f.id)
      if (result.saved) {
        toast.success(`PDF opgeslagen: ${result.filePath}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
  }

  function handlePdfPreview(f: Factuur) {
    setPreviewFactuur(f)
  }

  const filtered = facturen.filter((f) => {
    if (statusFilter !== 'alle' && f.status !== statusFilter) return false
    const q = zoek.toLowerCase()
    if (!q) return true
    return (
      f.factuurNummer.toLowerCase().includes(q) ||
      klantDisplayNaam(f.klant).toLowerCase().includes(q) ||
      (f.referentie || '').toLowerCase().includes(q)
    )
  })

  // Totalen voor geselecteerde filter
  const totaalIncl = filtered.reduce((sum, f) => sum + f.totaalIncl, 0)
  const openstaand = filtered
    .filter((f) => f.status === 'verstuurd')
    .reduce((sum, f) => sum + f.totaalIncl, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📄 Facturen</h1>
        <div className="flex gap-2">
          <button
            onClick={() => facturenApi.openFolder()}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm"
            title="Open de map met alle factuur-PDF's"
          >
            📁 PDF-map
          </button>
          <button
            onClick={() => navigate('/facturen/nieuw')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
          >
            + Nieuwe factuur
          </button>
        </div>
      </div>

      {/* Totaal-cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs uppercase text-gray-500 font-bold tracking-wide">Aantal</div>
          <div className="text-2xl font-bold mt-1">{filtered.length}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs uppercase text-gray-500 font-bold tracking-wide">
            Totaal (incl. BTW)
          </div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(totaalIncl)}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs uppercase text-gray-500 font-bold tracking-wide">Openstaand</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(openstaand)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Zoek op factuurnummer, klant of referentie..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
        >
          <option value="alle">Alle statussen</option>
          <option value="concept">📝 Concepten</option>
          <option value="verstuurd">📤 Verstuurd</option>
          <option value="betaald">✅ Betaald</option>
          <option value="geannuleerd">🚫 Geannuleerd</option>
        </select>
      </div>

      {/* Lijst */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {facturen.length === 0
              ? 'Nog geen facturen. Klik op "+ Nieuwe factuur" om te beginnen.'
              : 'Geen facturen gevonden met deze filters.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Nummer</th>
                <th className="text-left px-4 py-3">Datum</th>
                <th className="text-left px-4 py-3">Klant</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Bedrag</th>
                <th className="text-right px-4 py-3">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const status = statusConfig[f.status]
                const vervallen = isVervallen(f)
                return (
                  <tr key={f.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium font-mono">{f.factuurNummer}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(f.datum)}</td>
                    <td className="px-4 py-3">{klantDisplayNaam(f.klant)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.classes}`}
                      >
                        {status.icon} {status.label}
                      </span>
                      {vervallen && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                          ⚠️ Vervallen
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(f.totaalIncl)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <FactuurActies
                        factuur={f}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onEdit={() => navigate(`/facturen/${f.id}`)}
                        onPdfOpen={handlePdfOpen}
                        onPdfSaveAs={handlePdfSaveAs}
                        onPdfPreview={handlePdfPreview}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <PdfPreviewModal
        factuurId={previewFactuur?.id ?? null}
        factuurNummer={previewFactuur?.factuurNummer}
        onClose={() => setPreviewFactuur(null)}
      />
    </div>
  )
}

// ============================================================
// FactuurActies sub-component
// ============================================================

type ActiesProps = {
  factuur: Factuur
  onStatusChange: (f: Factuur, status: FactuurStatus) => void
  onDelete: (f: Factuur) => void
  onEdit: () => void
  onPdfOpen: (f: Factuur) => void
  onPdfSaveAs: (f: Factuur) => void
  onPdfPreview: (f: Factuur) => void
}

function FactuurActies({
  factuur,
  onStatusChange,
  onDelete,
  onEdit,
  onPdfOpen,
  onPdfSaveAs,
  onPdfPreview
}: ActiesProps) {
  const [open, setOpen] = useState(false)

  // PDF-knoppen voor alle statussen
  const pdfKnoppen = (
    <>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => {
          onPdfPreview(factuur)
          setOpen(false)
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
      >
        👁️ Voorbeeld
      </button>
      <button
        onClick={() => {
          onPdfOpen(factuur)
          setOpen(false)
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
      >
        📄 Open PDF
      </button>
      <button
        onClick={() => {
          onPdfSaveAs(factuur)
          setOpen(false)
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
      >
        💾 Opslaan als...
      </button>
    </>
  )

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600 font-medium"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1 text-left">
            {factuur.status === 'concept' && (
              <>
                <button
                  onClick={() => {
                    onEdit()
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  ✏️ Bewerken
                </button>
                <button
                  onClick={() => {
                    onStatusChange(factuur, 'verstuurd')
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-blue-600"
                >
                  📤 Markeer als verstuurd
                </button>
                <button
                  onClick={() => {
                    onDelete(factuur)
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                >
                  🗑️ Verwijderen
                </button>
                {pdfKnoppen}
              </>
            )}

            {factuur.status === 'verstuurd' && (
              <>
                <button
                  onClick={() => {
                    onEdit()
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  👁️ Bekijken
                </button>
                <button
                  onClick={() => {
                    onStatusChange(factuur, 'betaald')
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-green-600"
                >
                  ✅ Markeer als betaald
                </button>
                <button
                  onClick={async () => {
                    setOpen(false)
                    onStatusChange(factuur, 'geannuleerd')
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                >
                  🚫 Annuleren
                </button>
                {pdfKnoppen}
              </>
            )}

            {factuur.status === 'betaald' && (
              <>
                <button
                  onClick={() => {
                    onEdit()
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  👁️ Bekijken
                </button>
                {pdfKnoppen}
              </>
            )}

            {factuur.status === 'geannuleerd' && (
              <>
                <button
                  onClick={() => {
                    onEdit()
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  👁️ Bekijken
                </button>
                {pdfKnoppen}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
