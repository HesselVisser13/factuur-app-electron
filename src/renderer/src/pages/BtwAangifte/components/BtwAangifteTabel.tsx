//src/renderer/src/pages/BtwAangifte/components/BtwAangifteTabel.tsx

import { formatCurrency } from '@renderer/utils/formatters'
import type { BtwAangifte } from '@shared/types'

type BtwRegel = BtwAangifte['regels'][number]

interface Props {
  regels: BtwRegel[]
}

export function BtwAangifteTabel({ regels }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <caption className="sr-only">BTW-aangifte per tarief</caption>
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Tarief
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Omzet
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Verschuldigd
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Inkoop
            </th>
            <th
              scope="col"
              className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase"
            >
              Voorbelasting
            </th>
          </tr>
        </thead>
        <tbody>
          {regels.map((r) => (
            <tr key={r.percentage} className="border-b border-gray-100">
              <td className="px-4 py-3 text-sm font-medium">{r.tariefNaam}</td>
              <td className="px-4 py-3 text-sm text-right">{formatCurrency(r.omzet)}</td>
              <td className="px-4 py-3 text-sm text-right">{formatCurrency(r.verschuldigdeBtw)}</td>
              <td className="px-4 py-3 text-sm text-right">{formatCurrency(r.inkoop)}</td>
              <td className="px-4 py-3 text-sm text-right">{formatCurrency(r.voorbelasting)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
