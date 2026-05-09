// src/renderer/src/utils/money.ts

/**
 * Cents-based money utilities. Voorkomt float-rounding bugs.
 * Alle interne berekeningen in cents (integer); euros alleen voor I/O en display.
 */

/** Brand type: voorkomt per ongeluk vermengen van euros en cents */
export type Cents = number & { readonly __brand: 'Cents' }

/** Helpers om een number te casten naar Cents (tijdens berekeningen) */
const c = (n: number): Cents => n as Cents

// ============================================================
// Conversies
// ============================================================

/** Parse "100.50" of "100,50" → 10050 cents */
export function parseEuroString(value: string): Cents {
  if (!value) return c(0)
  const normalized = value.trim().replace(',', '.')
  const num = parseFloat(normalized)
  if (isNaN(num)) return c(0)
  return c(Math.round(num * 100))
}

/** 100.50 (euro) → 10050 (cents) — voor data uit DB/IPC */
export function euroToCents(euro: number): Cents {
  return c(Math.round(euro * 100))
}

/** 10050 (cents) → 100.50 (euro) — voor IPC submit */
export function centsToEuro(cents: Cents): number {
  return cents / 100
}

// ============================================================
// Berekeningen (alle integer-math)
// ============================================================

/** BTW-bedrag in cents, met Math.round (commercieel afronden) */
export function btwInCents(exclCents: Cents, percentage: number): Cents {
  return c(Math.round((exclCents * percentage) / 100))
}

/** Som van cent-bedragen (foutloos, integer optelling) */
export function sumCents(values: Cents[]): Cents {
  return c(values.reduce((sum, n) => sum + n, 0))
}

/** Vermenigvuldig cents met een aantal (integer keer integer = integer) */
export function multiplyCents(cents: Cents, factor: number): Cents {
  return c(Math.round(cents * factor))
}

// ============================================================
// Display
// ============================================================

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR'
})

/** 10050 → "€ 100,50" */
export function formatCents(cents: Cents): string {
  return currencyFormatter.format(cents / 100)
}
