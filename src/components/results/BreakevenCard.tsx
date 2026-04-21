import type { TCOResults } from '../../types'
import { formatEuro } from '../../utils/format'
import { CheckCircle, Clock } from 'lucide-react'

interface Props {
  results: TCOResults
  timeHorizon: number
}

export function BreakevenCard({ results, timeHorizon }: Props) {
  const { breakEvenYear, savingsTotal } = results
  const eCheaper = savingsTotal > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Break-even & Gesamtersparnis
      </div>

      {/* Break-even Badge */}
      <div className={`flex items-center gap-3 rounded-xl p-3 ${
        breakEvenYear === 1
          ? 'bg-green-100'
          : breakEvenYear !== null
          ? 'bg-blue-50'
          : 'bg-slate-100'
      }`}>
        {breakEvenYear !== null ? (
          <CheckCircle className={`w-6 h-6 flex-shrink-0 ${breakEvenYear === 1 ? 'text-green-600' : 'text-blue-600'}`} />
        ) : (
          <Clock className="w-6 h-6 flex-shrink-0 text-slate-400" />
        )}
        <div>
          {breakEvenYear !== null ? (
            <>
              <div className="font-bold text-slate-800">
                Break-even in Jahr {breakEvenYear}
              </div>
              <div className="text-xs text-slate-500">
                Ab dann ist der eLKW über den gesamten Zeitraum günstiger
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-slate-600">
                Kein Break-even in {timeHorizon} Jahren
              </div>
              <div className="text-xs text-slate-500">
                Betrachtungszeitraum verlängern oder Parameter anpassen
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gesamtersparnis */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
        <span className="text-sm text-slate-600">Gesamtersparnis über {timeHorizon} Jahre</span>
        <span className={`text-lg font-bold ${eCheaper ? 'text-green-700' : 'text-red-600'}`}>
          {eCheaper ? '+' : ''}{formatEuro(savingsTotal)}
        </span>
      </div>
    </div>
  )
}
