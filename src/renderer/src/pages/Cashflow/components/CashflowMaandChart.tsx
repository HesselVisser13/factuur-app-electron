// src/renderer/src/pages/Cashflow/components/CashflowMaandChart.tsx

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { formatCents, type Cents } from '@renderer/utils/money'
import type { MaandData } from '@shared/types'

interface Props {
  data: MaandData[]
}

export function CashflowMaandChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Inkomsten vs uitgaven per maand
        </h2>
        <div className="text-center text-gray-500 py-12 text-sm">Geen data voor deze periode</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
        Inkomsten vs uitgaven per maand
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Per maand het verschil tussen wat binnenkomt en wat eruit gaat.
      </p>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(v: number) =>
                v >= 100000 ? `€${(v / 100000).toFixed(0)}k` : `€${(v / 100).toFixed(0)}`
              }
            />
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
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
            />
            <Bar dataKey="inkomsten" name="Inkomsten" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="uitgaven" name="Uitgaven" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
