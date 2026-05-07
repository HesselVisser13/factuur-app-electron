// src/renderer/src/utils/validators.ts

/**
 * Validators voor frontend forms.
 * Geven `null` terug als waarde geldig is, anders een foutmelding.
 * Lege strings = geldig (gebruik `required` apart).
 */

export function validatePostcode(value: string): string | null {
  if (!value) return null
  if (!/^\d{4}\s?[A-Za-z]{2}$/.test(value.trim())) {
    return 'Postcode moet zijn als 1234 AB'
  }
  return null
}

export function validateEmail(value: string): string | null {
  if (!value) return null
  // Simpele check: ergens@ergens.iets
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Ongeldig e-mailadres'
  }
  return null
}

export function validateTelefoon(value: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!/^[\d\s+\-()]+$/.test(trimmed)) {
    return 'Alleen cijfers en + - ( ) toegestaan'
  }
  if (trimmed.length < 8) return 'Telefoonnummer te kort'
  if (trimmed.length > 20) return 'Telefoonnummer te lang'
  return null
}

export function validateKvk(value: string): string | null {
  if (!value) return null
  if (!/^\d{8}$/.test(value.trim())) {
    return 'KvK-nummer moet exact 8 cijfers zijn'
  }
  return null
}

export function validateBtwNummer(value: string): string | null {
  if (!value) return null
  if (!/^NL\d{9}B\d{2}$/i.test(value.trim())) {
    return 'BTW-nummer moet zijn als NL123456789B01'
  }
  return null
}

export function validateRequired(value: string, label: string = 'Veld'): string | null {
  if (!value || !value.trim()) {
    return `${label} is verplicht`
  }
  return null
}

export function validateMaxLength(
  value: string,
  max: number,
  label: string = 'Veld'
): string | null {
  if (value.trim().length > max) {
    return `${label} max ${max} tekens (nu ${value.trim().length})`
  }
  return null
}
