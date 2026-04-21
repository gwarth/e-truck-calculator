import type { TCOInputs } from '../../types'
import { SliderInput } from '../ui/SliderInput'
import { formatEuro } from '../../utils/format'
import { annuityFactor } from '../../utils/tcoFormulas'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function InfrastructureSection({ inputs, update }: Props) {
  const annualCost = inputs.depotChargingCapex *
    annuityFactor(inputs.discountRatePct, inputs.depotChargingLifeYears)

  return (
    <div className="space-y-4 mt-2">
      <SliderInput
        label="Depot-Ladeinfrastruktur (CAPEX)"
        value={inputs.depotChargingCapex}
        min={0} max={500_000} step={10_000}
        unit="€"
        formatDisplay={formatEuro}
        onChange={v => update('depotChargingCapex', v)}
        tooltip="150 kW DC Ladesäule inkl. Netzanschluss & Installation: 50.000–120.000 €. Mehrere Fahrzeuge: anteilig umgelegt."
      />
      <SliderInput
        label="Nutzungsdauer Ladeinfrastruktur"
        value={inputs.depotChargingLifeYears}
        min={5} max={20} step={1}
        unit="Jahre"
        onChange={v => update('depotChargingLifeYears', v)}
        tooltip="Wird separat über eigene Nutzungsdauer abgeschrieben – nicht auf den Fahrzeug-Betrachtungszeitraum begrenzt"
      />
      <div className="bg-blue-50 rounded-lg p-3 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Jährliche Infrastrukturkosten (annualisiert)</span>
          <span className="font-semibold text-blue-700">{formatEuro(annualCost)}/Jahr</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Verteilt auf {inputs.depotChargingLifeYears} Jahre bei {inputs.discountRatePct} % Diskontsatz
        </div>
      </div>
      <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 space-y-1">
        <div className="font-medium text-slate-600">Typische CAPEX-Positionen:</div>
        <div>• Ladesäule/Wallbox (AC 22 kW): 3.000–8.000 €</div>
        <div>• DC-Lader 150 kW: 35.000–60.000 €</div>
        <div>• Netzanschluss / Trafo-Upgrade: 20.000–300.000 €</div>
        <div>• Energiemanagementsystem: 5.000–20.000 €</div>
      </div>
    </div>
  )
}
