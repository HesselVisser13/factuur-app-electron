// src/renderer/src/pages/Instellingen.tsx

import { useEffect, useState } from 'react'
import { instellingenApi } from '../api'
import { useToast } from '../components/Toast'
import { btwTarievenApi } from '../api/btw-tarieven'
import type { BtwTarief } from '../../../shared/types'
import {
  validatePostcode,
  validateEmail,
  validateTelefoon,
  validateKvk,
  validateBtwNummer
} from '../utils/validators'

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
  reiskosten_uurtarief: string
  reiskosten_kmtarief: string
  reiskosten_btw_tarief_id: string
  reiskosten_omschrijving: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

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
    'Wij verzoeken u vriendelijk het verschuldigde bedrag binnen {betaaltermijn} dagen over te maken onder vermelding van het factuurnummer.',
  reiskosten_uurtarief: '55',
  reiskosten_kmtarief: '',
  reiskosten_btw_tarief_id: '',
  reiskosten_omschrijving: 'Reistijd'
}

// ============================================================
// Validatie-helpers (specifiek voor instellingen)
// ============================================================

function validateIban(value: string): string | null {
  if (!value) return null
  const stripped = value.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(stripped)) {
    return 'IBAN moet beginnen met landcode + 2 cijfers (bv. NL91...)'
  }
  if (stripped.length < 15 || stripped.length > 34) {
    return 'IBAN te kort of te lang'
  }
  if (stripped.startsWith('NL') && stripped.length !== 18) {
    return 'Nederlands IBAN moet 18 tekens zijn (incl. spaties weggelaten)'
  }
  return null
}

function validateBic(value: string): string | null {
  if (!value) return null
  // BIC is 8 of 11 tekens, alleen letters/cijfers
  if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/i.test(value.trim().replace(/\s/g, ''))) {
    return 'BIC moet 8 of 11 tekens zijn (alleen letters/cijfers)'
  }
  return null
}

function validateWebsite(value: string): string | null {
  if (!value) return null
  // Simpele URL-check: moet beginnen met http(s):// of www.
  if (!/^(https?:\/\/|www\.)/i.test(value.trim())) {
    return 'Website moet beginnen met http://, https:// of www.'
  }
  return null
}

function validateBetaaltermijn(value: string): string | null {
  if (!value) return 'Verplicht'
  const n = parseInt(value, 10)
  if (isNaN(n)) return 'Geen geldig getal'
  if (n < 1) return 'Minimaal 1 dag'
  if (n > 90) return 'Maximaal 90 dagen'
  return null
}

function validatePositiefBedrag(value: string, label: string): string | null {
  if (!value) return null
  const n = parseFloat(value)
  if (isNaN(n)) return `${label} moet een getal zijn`
  if (n < 0) return `${label} kan niet negatief zijn`
  if (n > 1000) return `${label} te hoog (max €1.000)`
  return null
}

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {}

  // Bedrijfsgegevens
  errors.email = validateEmail(form.email) ?? undefined
  errors.telefoon = validateTelefoon(form.telefoon) ?? undefined
  errors.website = validateWebsite(form.website) ?? undefined

  // Adres
  errors.postcode = validatePostcode(form.postcode) ?? undefined

  // Financieel
  errors.kvk_nummer = validateKvk(form.kvk_nummer) ?? undefined
  errors.btw_nummer = validateBtwNummer(form.btw_nummer) ?? undefined
  errors.iban = validateIban(form.iban) ?? undefined
  errors.bic = validateBic(form.bic) ?? undefined
  errors.betaaltermijn_dagen = validateBetaaltermijn(form.betaaltermijn_dagen) ?? undefined

  // Reiskosten
  errors.reiskosten_uurtarief =
    validatePositiefBedrag(form.reiskosten_uurtarief, 'Uurtarief') ?? undefined
  errors.reiskosten_kmtarief =
    validatePositiefBedrag(form.reiskosten_kmtarief, 'Km-tarief') ?? undefined

  if (form.reiskosten_omschrijving && form.reiskosten_omschrijving.length > 200) {
    errors.reiskosten_omschrijving = 'Maximaal 200 tekens'
  }

  // Voorwaarden tekst
  if (form.factuur_voorwaarden && form.factuur_voorwaarden.length > 1000) {
    errors.factuur_voorwaarden = 'Maximaal 1000 tekens'
  }

  // Cleanup undefined
  Object.keys(errors).forEach((key) => {
    if (errors[key as keyof FormErrors] === undefined) {
      delete errors[key as keyof FormErrors]
    }
  })

  return errors
}

// ============================================================
// Component
// ============================================================

export function Instellingen() {
  const [form, setForm] = useState<FormData>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const [tarieven, setTarieven] = useState<BtwTarief[]>([])

  useEffect(() => {
    Promise.all([instellingenApi.getAll(), btwTarievenApi.getActief()]).then(
      ([data, tarievenData]) => {
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
          factuur_voorwaarden: data.factuur_voorwaarden || defaultForm.factuur_voorwaarden,
          reiskosten_uurtarief: data.reiskosten_uurtarief || '55',
          reiskosten_kmtarief: data.reiskosten_kmtarief || '',
          reiskosten_btw_tarief_id: data.reiskosten_btw_tarief_id || '',
          reiskosten_omschrijving: data.reiskosten_omschrijving || 'Reistijd'
        })
        setTarieven(tarievenData)
      }
    )
  }, [])

  function updateField(key: keyof FormData, value: string) {
    const newForm = { ...form, [key]: value }
    setForm(newForm)
    setErrors(validateForm(newForm))
  }

  function handleBlur(key: keyof FormData) {
    setTouched({ ...touched, [key]: true })
    setErrors(validateForm(form))
  }

  function inputClasses(field: keyof FormData): string {
    const base = 'w-full border rounded-lg px-4 py-2 text-sm'
    const hasError = touched[field] && errors[field]
    return `${base} ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`
  }

  function errorMessage(field: keyof FormData) {
    const hasError = touched[field] && errors[field]
    if (!hasError) return null
    return <p className="text-xs text-red-600 mt-1">{errors[field]}</p>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Markeer alles als touched
    const formErrors = validateForm(form)
    setErrors(formErrors)
    setTouched(Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    if (Object.keys(formErrors).length > 0) {
      toast.error('Controleer de gemarkeerde velden')
      return
    }

    setSaving(true)
    try {
      await instellingenApi.save(form)
      toast.success('Instellingen opgeslagen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload() {
    const result = await instellingenApi.selectLogo()
    if (result?.fileName) {
      updateField('logo_filename', result.fileName)
    }
  }

  async function handleLogoRemove() {
    updateField('logo_filename', '')
  }

  // Banner alleen bij zichtbare fouten
  const heeftZichtbareErrors = Object.keys(errors).some((key) => touched[key])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Instellingen</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                onBlur={() => handleBlur('telefoon')}
                placeholder="06-12345678"
                className={inputClasses('telefoon')}
              />
              {errorMessage('telefoon')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="info@voorbeeld.nl"
                className={inputClasses('email')}
              />
              {errorMessage('email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                onBlur={() => handleBlur('website')}
                placeholder="https://www.voorbeeld.nl"
                className={inputClasses('website')}
              />
              {errorMessage('website')}
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
                onBlur={() => handleBlur('postcode')}
                placeholder="1234 AB"
                className={inputClasses('postcode')}
              />
              {errorMessage('postcode')}
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
                onBlur={() => handleBlur('kvk_nummer')}
                placeholder="12345678"
                className={inputClasses('kvk_nummer')}
              />
              {errorMessage('kvk_nummer')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">BTW-nummer</label>
              <input
                type="text"
                value={form.btw_nummer}
                onChange={(e) => updateField('btw_nummer', e.target.value)}
                onBlur={() => handleBlur('btw_nummer')}
                placeholder="NL123456789B01"
                className={inputClasses('btw_nummer')}
              />
              {errorMessage('btw_nummer')}
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
                onBlur={() => handleBlur('iban')}
                placeholder="NL00 BANK 0000 0000 00"
                className={inputClasses('iban')}
              />
              {errorMessage('iban')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">BIC</label>
              <input
                type="text"
                value={form.bic}
                onChange={(e) => updateField('bic', e.target.value)}
                onBlur={() => handleBlur('bic')}
                placeholder="BANKNL2A"
                className={inputClasses('bic')}
              />
              {errorMessage('bic')}
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
                onBlur={() => handleBlur('betaaltermijn_dagen')}
                className={inputClasses('betaaltermijn_dagen')}
              />
              {errorMessage('betaaltermijn_dagen')}
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

        {/* Reiskosten */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            🚗 Reiskosten
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Uurtarief reistijd (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.reiskosten_uurtarief}
                onChange={(e) => updateField('reiskosten_uurtarief', e.target.value)}
                onBlur={() => handleBlur('reiskosten_uurtarief')}
                placeholder="55,00"
                className={inputClasses('reiskosten_uurtarief')}
              />
              {errorMessage('reiskosten_uurtarief')}
              {!errors.reiskosten_uurtarief && (
                <p className="text-xs text-gray-500 mt-1">
                  Wordt vermenigvuldigd met aantal halve uren reistijd.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Km-tarief (€) <span className="text-gray-400 font-normal">— optioneel</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.reiskosten_kmtarief}
                onChange={(e) => updateField('reiskosten_kmtarief', e.target.value)}
                onBlur={() => handleBlur('reiskosten_kmtarief')}
                placeholder="0,21"
                className={inputClasses('reiskosten_kmtarief')}
              />
              {errorMessage('reiskosten_kmtarief')}
              {!errors.reiskosten_kmtarief && (
                <p className="text-xs text-gray-500 mt-1">
                  Vul in als je ook kilometers wilt doorberekenen.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Standaard BTW-tarief
              </label>
              <select
                value={form.reiskosten_btw_tarief_id}
                onChange={(e) => updateField('reiskosten_btw_tarief_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">-- Kies tarief --</option>
                {tarieven.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.naam} ({t.percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Standaard omschrijving
              </label>
              <input
                type="text"
                value={form.reiskosten_omschrijving}
                onChange={(e) => updateField('reiskosten_omschrijving', e.target.value)}
                onBlur={() => handleBlur('reiskosten_omschrijving')}
                placeholder="Reistijd"
                className={inputClasses('reiskosten_omschrijving')}
              />
              {errorMessage('reiskosten_omschrijving')}
              {!errors.reiskosten_omschrijving && (
                <p className="text-xs text-gray-500 mt-1">
                  Verschijnt op de factuur als omschrijving van de reisregel.
                </p>
              )}
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
                onBlur={() => handleBlur('factuur_voorwaarden')}
                rows={3}
                className={inputClasses('factuur_voorwaarden')}
              />
              {errorMessage('factuur_voorwaarden')}
              {!errors.factuur_voorwaarden && (
                <p className="text-xs text-gray-500 mt-1">
                  Tip: gebruik <code className="bg-gray-100 px-1 rounded">{'{betaaltermijn}'}</code>{' '}
                  om het aantal dagen automatisch in te vullen.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Banner */}
        {heeftZichtbareErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Er zijn nog fouten in het formulier. Controleer de gemarkeerde velden.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Opslaan...' : '💾 Opslaan'}
        </button>
      </form>
    </div>
  )
}
