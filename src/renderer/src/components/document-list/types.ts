// src/renderer/src/components/document-list/types.ts

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Klant } from '@shared/types'

/**
 * Status-config: hoe een status visueel gerenderd wordt.
 * Generic over het concrete status-type.
 */
export interface DocumentStatusInfo {
  label: string
  classes: string
  icon: LucideIcon
}

/**
 * Filter-optie voor status-dropdown.
 */
export interface DocumentStatusFilterOption<S extends string> {
  value: 'alle' | S
  label: string
}

/**
 * Een extra kolom (bv. "Geldig tot" voor offertes).
 */
export interface ExtraColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  render: (item: T) => ReactNode
}

/**
 * Adapter-functies om een generic Document te vertalen naar
 * de velden die de tabel nodig heeft. Zo blijven Factuur en
 * Offerte met verschillende veld-namen werken.
 */
export interface DocumentAdapter<T, S extends string> {
  getKey: (item: T) => number
  getNummer: (item: T) => string
  getDatum: (item: T) => string
  getKlant: (item: T) => Klant
  getStatus: (item: T) => S
  getTotaal: (item: T) => number
}

/**
 * Empty-state config voor lege tabel.
 */
export interface DocumentEmptyState {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  noResultsText: string
}
