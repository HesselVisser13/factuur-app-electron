// src/renderer/src/pages/Instellingen.tsx

import { useEffect, useState } from 'react'
import { instellingenApi } from '../api'

interface FormData {
  [key: string]: string
  bedrijfsnaam: string
  eigenaar_naam: string
  kvk_nummer: string
  btw_nummer: string
  iban: string
  bic: string
  banknaam: string
  adres: string
  postcode: string
  plaats: string
  telefoon: string
  email: string
  website: string
  betaaltermijn_dagen: string
  is_starter: string
  logo_filename: string
  factuur_voorwaarden: string
}

const defaultForm: FormData = {
  bedrijfsnaam: '',
  eigenaar_naam: '',
  kvk_nummer: '',
  btw_nummer: '',
  iban: '',
  bic: '',
  banknaam: '',
  adres: '',
  postcode: '',
  plaats: '',
  telefoon: '',
  email: '',
  website: '',
  betaaltermijn_dagen: '14',
  is_starter: 'false',
  logo_filename: '',
  factuur_voorwaarden:
    'Wij verzoeken u vriendelijk het verschuldigde bedrag binnen {betaaltermijn} dagen over te maken onder vermelding van het factuurnummer.'
}

export function Instellingen() {
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    instellingenApi.getAll().then((data) => {
      setForm({
        bedrijfsnaam: data.bedrijfsnaam || '',
        eigenaar_naam: data.eigenaar_naam || '',
        kvk_nummer: data.kvk_nummer || '',
        btw_nummer: data.btw_nummer || '',
        iban: data.iban || '',
        bic: data.bic || '',
        banknaam: data.banknaam || '',
        adres: data.adres || '',
        postcode: data.postcode || '',
        plaats: data.plaats || '',
        telefoon: data.telefoon || '',
        email: data.email || '',
        website: data.website || '',
        betaaltermijn_dagen: data.betaaltermijn_dagen || '14',
        is_starter: data.is_starter || 'false',
        logo_filename: data.logo_filename || '',
        factuur_voorwaarden: data.factuur_voorwaarden || defaultForm.factuur_voorwaarden
      })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    await instellingenApi.save(form)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function updateField(key: keyof FormData, value: string) {
    setForm({ ...form, [key]: value })
  }

  async function handleLogoUpload() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Instellingen</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bedrijfsgegevens */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Bedrijfsgegevens
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Bedrijfsnaam</label>
              <input
                type="text"
                value={form.bedrijfsnaam}
                onChange={(e) => updateField('bedrijfsnaam', e.target.value)}
                placeholder="Bijv. Warmtepomp Installaties Jansen"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Naam eigenaar</label>
              <input
                type="text"
                value={form.eigenaar_naam}
                onChange={(e) => updateField('eigenaar_naam', e.target.value)}
                placeholder="Bijv. Jan Jansen"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Telefoon</label>
              <input
                type="tel"
                value={form.telefoon}
                onChange={(e) => updateField('telefoon', e.target.value)}
                placeholder="06-12345678"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="info@voorbeeld.nl"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.voorbeeld.nl"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Adres */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Adres</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Straat + huisnummer
              </label>
              <input
                type="text"
                value={form.adres}
                onChange={(e) => updateField('adres', e.target.value)}
                placeholder="Werkstraat 1"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Postcode</label>
              <input
                type="text"
                value={form.postcode}
                onChange={(e) => updateField('postcode', e.target.value)}
                placeholder="1234 AB"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Plaats</label>
              <input
                type="text"
                value={form.plaats}
                onChange={(e) => updateField('plaats', e.target.value)}
                placeholder="Amsterdam"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Financieel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Financiële gegevens
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">KvK-nummer</label>
              <input
                type="text"
                value={form.kvk_nummer}
                onChange={(e) => updateField('kvk_nummer', e.target.value)}
                placeholder="12345678"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">BTW-nummer</label>
              <input
                type="text"
                value={form.btw_nummer}
                onChange={(e) => updateField('btw_nummer', e.target.value)}
                placeholder="NL123456789B01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Banknaam</label>
              <input
                type="text"
                value={form.banknaam}
                onChange={(e) => updateField('banknaam', e.target.value)}
                placeholder="Mijn Banknaam"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">IBAN</label>
              <input
                type="text"
                value={form.iban}
                onChange={(e) => updateField('iban', e.target.value)}
                placeholder="NL00 BANK 0000 0000 00"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">BIC</label>
              <input
                type="text"
                value={form.bic}
                onChange={(e) => updateField('bic', e.target.value)}
                placeholder="Mijn Bank BIC Code"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Betaaltermijn (dagen)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={form.betaaltermijn_dagen}
                onChange={(e) => updateField('betaaltermijn_dagen', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Starter (kleineondernemersregeling)?
              </label>
              <select
                value={form.is_starter}
                onChange={(e) => updateField('is_starter', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                <option value="false">Nee</option>
                <option value="true">Ja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Factuur */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Factuur</h2>

          <div className="space-y-4">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Bedrijfslogo</label>
              {form.logo_filename ? (
                <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <img
                    src={`app-logo://${form.logo_filename}`}
                    alt="Logo"
                    className="h-16 w-auto object-contain"
                  />
                  <div className="flex-1 text-xs text-gray-500 truncate">{form.logo_filename}</div>
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg px-6 py-8 w-full text-gray-500 hover:text-blue-600 transition-colors text-sm"
                >
                  🖼️ Klik om een logo te uploaden (PNG/JPG)
                </button>
              )}
            </div>

            {/* Voorwaarden */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Voorwaardentekst onderaan factuur
              </label>
              <textarea
                value={form.factuur_voorwaarden}
                onChange={(e) => updateField('factuur_voorwaarden', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: gebruik <code className="bg-gray-100 px-1 rounded">{'{betaaltermijn}'}</code>{' '}
                om het aantal dagen automatisch in te vullen.
              </p>
            </div>
          </div>
        </div>

        {/* Opslaan */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : '💾 Opslaan'}
          </button>

          {saved && (
            <span className="text-green-600 font-medium text-sm animate-pulse">
              ✓ Instellingen opgeslagen!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
