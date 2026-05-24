// src/renderer/src/pages/Cashflow/components/CashflowUitgavenChart.tsx

import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { formatCents, type Cents } from '@renderer/utils/money'
import type { CategorieData } from '@shared/types'

interface Props {
  data: CategorieData[]
}

// Tailwind-vriendelijke kleuren — sorteren op visuele variatie
const COLORS = [
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6b7280' // gray-500 (voor "onbekend"/overige)
]

export function CashflowUitgavenChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4" aria-hidden="true" />
          Uitgaven per categorie
        </h2>
        <div className="text-center text-gray-500 py-12 text-sm">Geen uitgaven in deze periode</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <PieChartIcon className="w-4 h-4" aria-hidden="true" />
        Uitgaven per categorie
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Chart */}
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="bedrag"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  if (typeof value !== 'number') return ['', String(name)]
                  return [formatCents(value as Cents), String(name)]
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda */}
        <div className="space-y-2">
          {data.map((cat, index) => (
            <div key={cat.categorie} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                aria-hidden="true"
              />
              <span className="flex-1 text-gray-700 truncate">{cat.label}</span>
              <span className="text-gray-500 text-xs tabular-nums">
                {cat.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-900 font-medium tabular-nums">
                {formatCents(cat.bedrag as Cents)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
