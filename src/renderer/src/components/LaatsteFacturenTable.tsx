// src/renderer/src/components/LaatsteFacturenTable.tsx

import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import { klantDisplayNaam } from '@shared/klant-utils'
import { StatusBadge, type FactuurStatus } from './StatusBadge'
import type { DashboardStats } from '@shared/types'

type Factuur = DashboardStats['laatsteFacturen'][number]

interface LaatsteFacturenTableProps {
  facturen: Factuur[]
  toonExcl: boolean
}

export function LaatsteFacturenTable({ facturen, toonExcl }: LaatsteFacturenTableProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th scope="col" className="text-left px-4 py-3">
              Nummer
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Datum
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Klant
            </th>
            <th scope="col" className="text-left px-4 py-3">
              Status
            </th>
            <th scope="col" className="text-right px-4 py-3">
              Bedrag
            </th>
          </tr>
        </thead>
        <tbody>
          {facturen.map((f) => {
            const vervallen = f.status === 'verstuurd' && new Date(f.vervalDatum) < new Date()
            const goTo = () => {
              navigate(`/facturen/${f.id}`)
            }

            return (
              <tr
                key={f.id}
                onClick={goTo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    goTo()
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open factuur ${f.factuurNummer}`}
                className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <td className="px-4 py-3 font-medium font-mono">{f.factuurNummer}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(f.datum)}</td>
                <td className="px-4 py-3">{klantDisplayNaam(f.klant)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={f.status as FactuurStatus} vervallen={vervallen} />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(toonExcl ? f.totaalExcl : f.totaalIncl)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
