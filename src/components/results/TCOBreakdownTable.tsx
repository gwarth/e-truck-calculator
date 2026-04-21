import type { TCOResults } from '../../types'
import { formatEuro } from '../../utils/format'

interface Props {
  results: TCOResults
  timeHorizon: number
}

interface RowProps {
  label: string
  electric: number
  diesel: number
  highlight?: boolean
}

function Row({ label, electric, diesel, highlight }: RowProps) {
  const diff = diesel - electric
  const eSaving = diff > 0

  return (
    <tr className={`border-t border-slate-100 ${highlight ? 'bg-slate-50 font-semibold' : ''}`}>
      <td className="py-2 pr-3 text-sm text-slate-600">{label}</td>
      <td className="py-2 text-right text-sm text-blue-700 font-medium">{formatEuro(electric)}</td>
      <td className="py-2 text-right text-sm text-amber-700 font-medium">{formatEuro(diesel)}</td>
      <td className={`py-2 pl-3 text-right text-xs font-medium ${eSaving ? 'text-green-600' : 'text-red-500'}`}>
        {diff !== 0 ? (eSaving ? '-' : '+') + formatEuro(Math.abs(diff)) : '—'}
      </td>
    </tr>
  )
}

export function TCOBreakdownTable({ results, timeHorizon }: Props) {
  const { electric: e, diesel: d } = results

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Kostenaufschlüsselung über {timeHorizon} Jahre
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="text-left pb-2 font-medium">Kostenblock</th>
              <th className="text-right pb-2 font-medium text-blue-600">⚡ eLKW</th>
              <th className="text-right pb-2 font-medium text-amber-600">⛽ Diesel</th>
              <th className="text-right pb-2 pl-3 font-medium text-slate-500">Δ</th>
            </tr>
          </thead>
          <tbody>
            <Row
              label="Fahrzeug (CAPEX)"
              electric={e.capexAnnualized * timeHorizon}
              diesel={d.capexAnnualized * timeHorizon}
            />
            <Row
              label="Ladeinfrastruktur"
              electric={e.infraAnnualized * timeHorizon}
              diesel={0}
            />
            <Row
              label="Energie / Kraftstoff"
              electric={e.energyTotal}
              diesel={d.energyTotal}
            />
            <Row
              label="Wartung & Reparatur"
              electric={e.maintenanceTotal}
              diesel={d.maintenanceTotal}
            />
            <Row
              label="Reifen"
              electric={e.tiresTotal}
              diesel={d.tiresTotal}
            />
            <Row
              label="Versicherung"
              electric={e.insuranceTotal}
              diesel={d.insuranceTotal}
            />
            <Row
              label="Kfz-Steuer"
              electric={e.taxTotal}
              diesel={d.taxTotal}
            />
            <Row
              label="Maut"
              electric={e.tollTotal}
              diesel={d.tollTotal}
            />
            <Row
              label="Gesamt"
              electric={e.totalOverHorizon}
              diesel={d.totalOverHorizon}
              highlight
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
