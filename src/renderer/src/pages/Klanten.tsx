import { useEffect, useState } from 'react'
import { klantenApi } from '../api/klanten'
import type { Klant } from '../../../shared/types'
import type { KlantInput } from '../../../shared/schemas'
import { klantDisplayNaam } from '../../../shared/klant-utils'

type FormState = {
  type: 'particulier' | 'zakelijk'
  bedrijfsnaam: string
  aanhef: string
  voornaam: string
  achternaam: string
  adres: string
  postcode: string
  plaats: string
  email: string
  telefoon: string
  kvkNummer: string
  btwNummer: string
}

const emptyForm: FormState = {
  type: 'particulier',
  bedrijfsnaam: '',
  aanhef: '',
  voornaam: '',
  achternaam: '',
  adres: '',
  postcode: '',
  plaats: '',
  email: '',
  telefoon: '',
  kvkNummer: '',
  btwNummer: ''
}

export function Klanten() {
  const [klanten, setKlanten] = useState<Klant[]>([])
  const [zoek, setZoek] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await klantenApi.getAll()
    setKlanten(data)
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setForm(emptyForm)
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(k: Klant) {
    setForm({
      type: k.type,
      bedrijfsnaam: k.bedrijfsnaam || '',
      aanhef: k.aanhef || '',
      voornaam: k.voornaam || '',
      achternaam: k.achternaam || '',
      adres: k.adres || '',
      postcode: k.postcode || '',
      plaats: k.plaats || '',
      email: k.email || '',
      telefoon: k.telefoon || '',
      kvkNummer: k.kvkNummer || '',
      btwNummer: k.btwNummer || ''
    })
    setEditId(k.id)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const input = form as KlantInput
      if (editId) {
        await klantenApi.update({ ...input, id: editId })
      } else {
        await klantenApi.create(input)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      alert('Fout: ' + (err instanceof Error ? err.message : 'onbekend'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(k: Klant) {
    if (!confirm(`Klant "${klantDisplayNaam(k)}" verwijderen?`)) return
    try {
      await klantenApi.delete(k.id)
      await load()
    } catch (err) {
      alert('Verwijderen mislukt: ' + (err instanceof Error ? err.message : 'onbekend'))
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value })
  }

  const filtered = klanten.filter((k) => {
    const q = zoek.toLowerCase()
    return (
      klantDisplayNaam(k).toLowerCase().includes(q) ||
      (k.plaats || '').toLowerCase().includes(q) ||
      (k.email || '').toLowerCase().includes(q)
    )
  })

  const isZakelijk = form.type === 'zakelijk'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">👥 Klanten</h1>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
        >
          + Nieuwe klant
        </button>
      </div>

      <input
        type="text"
        placeholder="Zoek op naam, plaats of e-mail..."
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {klanten.length === 0
              ? 'Nog geen klanten. Klik op "+ Nieuwe klant" om te beginnen.'
              : 'Geen klanten gevonden.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Naam</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Plaats</th>
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-right px-4 py-3">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((k) => (
                <tr key={k.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{klantDisplayNaam(k)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        k.type === 'zakelijk'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {k.type === 'zakelijk' ? 'Zakelijk' : 'Particulier'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{k.plaats || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{k.email || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(k)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(k)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{editId ? 'Klant bewerken' : 'Nieuwe klant'}</h2>

              {/* Type-toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => updateField('type', 'particulier')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    form.type === 'particulier'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  👤 Particulier
                </button>
                <button
                  type="button"
                  onClick={() => updateField('type', 'zakelijk')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    form.type === 'zakelijk'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏢 Zakelijk
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bedrijfsnaam (alleen zakelijk) */}
                {isZakelijk && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Bedrijfsnaam *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.bedrijfsnaam}
                      onChange={(e) => updateField('bedrijfsnaam', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                )}

                {/* Naam */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Aanhef</label>
                  <select
                    value={form.aanhef}
                    onChange={(e) => updateField('aanhef', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  >
                    <option value="">-</option>
                    <option value="Dhr.">Dhr.</option>
                    <option value="Mevr.">Mevr.</option>
                  </select>
                </div>

                <div />

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Voornaam</label>
                  <input
                    type="text"
                    value={form.voornaam}
                    onChange={(e) => updateField('voornaam', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Achternaam {!isZakelijk && '*'}
                  </label>
                  <input
                    type="text"
                    required={!isZakelijk}
                    value={form.achternaam}
                    onChange={(e) => updateField('achternaam', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                {/* Adres */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Adres</label>
                  <input
                    type="text"
                    value={form.adres}
                    onChange={(e) => updateField('adres', e.target.value)}
                    placeholder="Straatnaam 1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(e) => updateField('postcode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Plaats</label>
                  <input
                    type="text"
                    value={form.plaats}
                    onChange={(e) => updateField('plaats', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefoon</label>
                  <input
                    type="tel"
                    value={form.telefoon}
                    onChange={(e) => updateField('telefoon', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                {/* KvK/BTW (alleen zakelijk) */}
                {isZakelijk && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        KvK-nummer
                      </label>
                      <input
                        type="text"
                        value={form.kvkNummer}
                        onChange={(e) => updateField('kvkNummer', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        BTW-nummer
                      </label>
                      <input
                        type="text"
                        value={form.btwNummer}
                        onChange={(e) => updateField('btwNummer', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Opslaan...' : editId ? 'Bijwerken' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
