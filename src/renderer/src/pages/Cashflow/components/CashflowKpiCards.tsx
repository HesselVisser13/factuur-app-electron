// src/renderer/src/pages/Cashflow/components/CashflowKpiCards.tsx

import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  type LucideIcon
} from 'lucide-react'

import { formatCents, type Cents } from '@renderer/utils/money'
import type { CashflowKpis } from '@shared/types'

interface Props {
  kpis: CashflowKpis
}

export function CashflowKpiCards({ kpis }: Props) {
  const isPositief = kpis.resultaat >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Gefactureerd"
        value={formatCents(kpis.gefactureerd as Cents)}
        icon={ArrowUpRight}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        subText={`${kpis.aantalFacturen} ${kpis.aantalFacturen === 1 ? 'factuur' : 'facturen'}`}
      />

      <KpiCard
        label="Daarvan ontvangen"
        value={formatCents(kpis.ontvangen as Cents)}
        icon={CheckCircle2}
        iconColor="text-green-600"
        iconBg="bg-green-50"
        subText={
          kpis.openstaand > 0 ? `Open: ${formatCents(kpis.openstaand as Cents)}` : 'Alles betaald'
        }
        subTextIcon={kpis.openstaand > 0 ? Clock : undefined}
        subTextColor={kpis.openstaand > 0 ? 'text-amber-600' : 'text-gray-500'}
      />

      <KpiCard
        label="Uitgaven"
        value={formatCents(kpis.uitgaven as Cents)}
        icon={ArrowDownRight}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        subText={`${kpis.aantalTransacties} ${kpis.aantalTransacties === 1 ? 'transactie' : 'transacties'}`}
      />

      <KpiCard
        label="Resultaat"
        value={formatCents(kpis.resultaat as Cents)}
        icon={isPositief ? TrendingUp : TrendingDown}
        iconColor={isPositief ? 'text-green-600' : 'text-red-600'}
        iconBg={isPositief ? 'bg-green-50' : 'bg-red-50'}
        subText="Gefactureerd minus uitgaven"
        valueColor={isPositief ? 'text-gray-900' : 'text-red-700'}
      />
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  subText: string
  subTextIcon?: LucideIcon
  subTextColor?: string
  valueColor?: string
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subText,
  subTextIcon: SubIcon,
  subTextColor = 'text-gray-500',
  valueColor = 'text-gray-900'
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className={`text-xs mt-1 flex items-center gap-1 ${subTextColor}`}>
        {SubIcon && <SubIcon className="w-3 h-3" aria-hidden="true" />}
        {subText}
      </div>
    </div>
  )
}
