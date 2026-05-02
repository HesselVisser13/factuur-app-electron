// src/shared/constants.ts

export const TRANSACTIE_TYPES = [
  { value: 'inkomst', label: '📥 Inkomst', color: 'green' },
  { value: 'uitgave', label: '📤 Uitgave', color: 'red' }
] as const

export const CATEGORIEEN = [
  { value: 'arbeid', label: '👷 Arbeid' },
  { value: 'materiaal', label: '🔩 Materiaal' },
  { value: 'transport', label: '🚐 Transport' },
  { value: 'gereedschap', label: '🔧 Gereedschap' },
  { value: 'overig', label: '📦 Overig' }
] as const

export const INVOERWIJZEN = [
  { value: 'exclusief', label: 'Exclusief BTW (ik reken door)' },
  { value: 'inclusief', label: 'Inclusief BTW (bonnetje/kassabon)' }
] as const

export const KWARTALEN = [
  { value: 1, label: 'Q1 (jan-mrt)' },
  { value: 2, label: 'Q2 (apr-jun)' },
  { value: 3, label: 'Q3 (jul-sep)' },
  { value: 4, label: 'Q4 (okt-dec)' }
] as const
