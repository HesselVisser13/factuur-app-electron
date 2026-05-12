/**
 * Cents-based money utilities. Voorkomt float-rounding bugs.
 * Alle interne berekeningen in cents (integer); euros alleen voor I/O en display.
 */

export type Cents = number & { readonly __brand: 'Cents' }

const c = (n: number): Cents => n as Cents

/**
 * Math.round met geschaalde EPSILON-correctie.
 *
 * Float-precisie schaalt mee met de magnitude van het getal:
 * 100 * 1.005 levert 100.49999999999999 op (verschil ~1e-14).
 * Number.EPSILON (2.22e-16) is te klein, vermenigvuldiging met |n| schaalt mee.
 */
const safeRound = (n: number): number => Math.round(n + Number.EPSILON * Math.abs(n))

// ============================================================
// Conversies
// ============================================================

export function parseEuroString(value: string): Cents {
  if (!value) return c(0)
  const normalized = value.trim().replace(',', '.')
  const num = parseFloat(normalized)
  if (isNaN(num)) return c(0)
  return c(safeRound(num * 100))
}

export function euroToCents(euro: number): Cents {
  return c(safeRound(euro * 100))
}

export function centsToEuro(cents: Cents): number {
  return cents / 100
}

// ============================================================
// Berekeningen
// ============================================================

export function btwInCents(exclCents: Cents, percentage: number): Cents {
  return c(safeRound((exclCents * percentage) / 100))
}

export function sumCents(values: Cents[]): Cents {
  return c(values.reduce((sum, n) => sum + n, 0))
}

export function multiplyCents(cents: Cents, factor: number): Cents {
  return c(safeRound(cents * factor))
}

// ============================================================
// Display
// ============================================================

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR'
})

export function formatCents(cents: Cents): string {
  return currencyFormatter.format(cents / 100)
}
