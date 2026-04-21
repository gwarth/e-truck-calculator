import type { TCOResults } from '../../types'
import { formatEuroPerKm, formatPct } from '../../utils/format'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  results: TCOResults
}

export function CostPerKmCard({ results }: Props) {
  const eSavings = results.diesel.costPerKm - results.electric.costPerKm
  const eCheaper = eSavings > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Kosten pro Kilometer (Fahrzeugseite, ohne Fahrerlohn)
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium mb-1">⚡ eLKW</div>
          <div className="text-2xl font-bold text-blue-700">
            {formatEuroPerKm(results.electric.costPerKm)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {(results.electric.costPerKm * 100).toFixed(1).replace('.', ',')} ct/km
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-xs text-amber-600 font-medium mb-1">⛽ Diesel</div>
          <div className="text-2xl font-bold text-amber-700">
            {formatEuroPerKm(results.diesel.costPerKm)}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            {(results.diesel.costPerKm * 100).toFixed(1).replace('.', ',')} ct/km
          </div>
        </div>
      </div>
      <div className={`mt-3 rounded-lg p-2.5 flex items-center gap-2 text-sm font-semibold ${
        eCheaper
          ? 'bg-green-100 text-green-800'
          : 'bg-red-50 text-red-700'
      }`}>
        {eCheaper
          ? <TrendingDown className="w-4 h-4" />
          : <TrendingUp className="w-4 h-4" />}
        <span>
          eLKW {eCheaper ? 'spart' : 'kostet'}{' '}
          {Math.abs(eSavings * 100).toFixed(1).replace('.', ',')} ct/km
          {' '}({formatPct(Math.abs(results.savingsPct))} {eCheaper ? 'günstiger' : 'teurer'})
        </span>
      </div>
    </div>
  )
}
