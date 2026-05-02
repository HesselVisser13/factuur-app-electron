// src/renderer/src/utils/formatters.ts

export function formatCurrency(bedrag: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(bedrag)
}

export function formatDate(datum: Date | string): string {
  const d = typeof datum === 'string' ? new Date(datum) : datum
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

// Backwards compatibility aliases (kunnen later verwijderd worden)
export const formatBedrag = formatCurrency
export const formatDatumKort = formatDate
