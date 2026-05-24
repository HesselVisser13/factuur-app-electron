// src/renderer/src/pages/Cashflow/components/CashflowSaldoChart.tsx

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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

export function CashflowSaldoChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Cumulatief saldo
        </h2>
        <div className="text-center text-gray-500 py-12 text-sm">Geen data voor deze periode</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
        Cumulatief saldo
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Inkomsten min uitgaven, opgeteld vanaf het begin van de periode.
      </p>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
              formatter={(value) => {
                if (typeof value !== 'number') return ['', 'Saldo']
                return [formatCents(value as Cents), 'Saldo']
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
