import type { TCOInputs } from '../../types'
import { SliderInput } from '../ui/SliderInput'
import { annualDieselEnergyCost } from '../../utils/tcoFormulas'
import { computeSurcharge, surchargeScenarios } from '../../utils/fuelSurcharge'
import { formatEuro, formatPct } from '../../utils/format'
import { AlertTriangle } from 'lucide-react'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function FuelSurchargeSection({ inputs, update }: Props) {
  const annualFuelCost = annualDieselEnergyCost(inputs)
  const result = computeSurcharge(
    inputs.dieselPrice,
    inputs.fuelSurchargeBaseDieselPrice,
    annualFuelCost,
    inputs.fuelSurchargePassthroughPct
  )
  const scenarios = surchargeScenarios(
    inputs.fuelSurchargeBaseDieselPrice,
    inputs.dieselPrice,
    annualFuelCost,
    inputs.fuelSurchargePassthroughPct
  )

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
        <div>
          <div className="font-medium">Dieselpreisrisiko für Spediteure</div>
          <div className="text-xs mt-1 text-amber-800">
            Speditionen vereinbaren mit Kunden einen Basis-Dieselpreis (z.B. 1,20 €/L).
            Bei Überschreitung darf ein Zuschlag erhoben werden – dieser ist aber im Wettbewerb
            oft nicht vollständig durchsetzbar. eLKW-Betreiber haben dieses Risiko nicht.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Dieselzuschlag-Analyse aktivieren</label>
        <button
          type="button"
          onClick={() => update('fuelSurchargeEnabled', !inputs.fuelSurchargeEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            inputs.fuelSurchargeEnabled ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              inputs.fuelSurchargeEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {inputs.fuelSurchargeEnabled && (
        <div className="space-y-4">
          <SliderInput
            label="Basis-Dieselpreis (vertraglich)"
            value={inputs.fuelSurchargeBaseDieselPrice}
            min={0.80} max={2.00} step={0.05}
            unit="€/L"
            onChange={v => update('fuelSurchargeBaseDieselPrice', v)}
            tooltip="Vertraglich vereinbarter Referenzpreis, ab dem der Zuschlag greift. DSLV-Empfehlung: monatlich anpassen"
          />
          <SliderInput
            label="Durchsetzbarkeit des Zuschlags"
            value={inputs.fuelSurchargePassthroughPct}
            min={0} max={100} step={5}
            unit="%"
            onChange={v => update('fuelSurchargePassthroughPct', v)}
            tooltip="Im Wettbewerb können oft nur 60–80 % des theoretischen Zuschlags durchgesetzt werden"
          />

          {/* Aktuelles Ergebnis */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-700">Aktuelle Situation</div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Diesel über Basis</span>
              <span className="font-medium">
                {inputs.dieselPrice > inputs.fuelSurchargeBaseDieselPrice
                  ? `+${(inputs.dieselPrice - inputs.fuelSurchargeBaseDieselPrice).toFixed(2).replace('.', ',')} €/L`
                  : 'Kein Zuschlag fällig'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Theor. Zuschlagsrate</span>
              <span className="font-medium">{formatPct(result.surchargeRatePct)} auf Frachtrate</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Davon durchsetzbar</span>
              <span className="font-medium text-green-700">+{formatEuro(result.recoveredCostPerYear)}/Jahr</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-100 pt-2 mt-2">
              <span className="text-slate-700 font-medium">Ungedecktes Preisrisiko</span>
              <span className="font-bold text-red-600">{formatEuro(result.unrecoveredRiskPerYear)}/Jahr</span>
            </div>
          </div>

          {/* Szenarien-Tabelle */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Szenarien: Was wenn der Diesel steigt?
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-2 font-medium text-slate-600">Szenario</th>
                    <th className="text-right p-2 font-medium text-slate-600">Preis</th>
                    <th className="text-right p-2 font-medium text-slate-600">Zuschlag</th>
                    <th className="text-right p-2 font-medium text-red-600">Risiko/Jahr</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map(s => (
                    <tr key={s.label} className="border-t border-slate-100">
                      <td className="p-2 text-slate-700">{s.label}</td>
                      <td className="p-2 text-right">{s.dieselPrice.toFixed(2).replace('.', ',')} €/L</td>
                      <td className="p-2 text-right">{formatPct(s.result.surchargeRatePct)}</td>
                      <td className="p-2 text-right text-red-600 font-medium">
                        {formatEuro(s.result.unrecoveredRiskPerYear)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              eLKW-Betreiber: kein Kraftstoffpreisrisiko — stabile Kalkulation gegenüber Kunden.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
