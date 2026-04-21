import type { TCOResults } from '../../types'
import { formatEuro, formatTons } from '../../utils/format'
import { Leaf, Euro } from 'lucide-react'

interface Props {
  results: TCOResults
  dieselFuelRisk: number
  fuelSurchargeEnabled: boolean
}

export function SavingsSummary({ results, dieselFuelRisk, fuelSurchargeEnabled }: Props) {
  const eCheaper = results.savingsTotal > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Zusammenfassung
      </div>

      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        eCheaper ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <Euro className={`w-5 h-5 flex-shrink-0 ${eCheaper ? 'text-green-600' : 'text-red-500'}`} />
        <div>
          <div className={`font-bold text-sm ${eCheaper ? 'text-green-800' : 'text-red-700'}`}>
            {eCheaper
              ? `eLKW spart ${formatEuro(results.savingsTotal)} über ${Math.round(results.savingsTotal / results.electric.totalPerYear * 10) / 10} Jahre`
              : `eLKW kostet ${formatEuro(Math.abs(results.savingsTotal))} mehr`}
          </div>
          <div className={`text-xs mt-0.5 ${eCheaper ? 'text-green-700' : 'text-red-600'}`}>
            Gesamtzeitraum alle Kostenblöcke
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <Leaf className="w-5 h-5 flex-shrink-0 text-emerald-600" />
        <div>
          <div className="font-bold text-sm text-emerald-800">
            {formatTons(results.co2SavedKg)} CO₂ eingespart
          </div>
          <div className="text-xs mt-0.5 text-emerald-700">
            gegenüber Diesel-Betrieb (WTW-Bilanz)
          </div>
        </div>
      </div>

      {fuelSurchargeEnabled && dieselFuelRisk > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-amber-600 text-base flex-shrink-0">⚠️</span>
          <div>
            <div className="font-bold text-sm text-amber-800">
              + {formatEuro(dieselFuelRisk)}/Jahr Preisrisiko (Diesel)
            </div>
            <div className="text-xs mt-0.5 text-amber-700">
              Nicht gedeckt durch Dieselzuschlag — entfällt beim eLKW komplett
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
