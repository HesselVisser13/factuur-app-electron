// src/renderer/src/utils/datum.ts

/** Locale-safe yyyy-MM-dd zonder UTC-shift. */
export function toDatumInput(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function voegDagenToe(isoDatum: string, dagen: number): string {
  const d = new Date(isoDatum)
  d.setDate(d.getDate() + dagen)
  return toDatumInput(d)
}

export function isGeldigeDatumString(s: string): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return !isNaN(new Date(s).getTime())
}

/** Knipt een ISO-datetime ('2024-01-15T...') naar een datum-input string. */
export const datumInputUit = (iso: string): string => iso.substring(0, 10)
