import type { TCOInputs } from '../../types'
import { SliderInput } from '../ui/SliderInput'
import { formatEuro } from '../../utils/format'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function OpexSection({ inputs, update }: Props) {
  return (
    <div className="space-y-5 mt-2">
      {/* Variable Kosten pro km */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Variable Kosten (€/km)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div className="text-xs font-medium text-blue-700">⚡ eLKW</div>
            <SliderInput
              label="Wartung & Reparatur"
              value={inputs.electricMaintenancePerKm}
              min={0.01} max={0.20} step={0.005}
              unit="€/km"
              onChange={v => update('electricMaintenancePerKm', v)}
              tooltip="Richtwert ACEA/BGL: ~0,05 €/km. Kein Ölwechsel, weniger Bremsbeläge durch Rekuperation"
            />
            <SliderInput
              label="Reifen"
              value={inputs.electricTiresCostPerKm}
              min={0.01} max={0.10} step={0.005}
              unit="€/km"
              onChange={v => update('electricTiresCostPerKm', v)}
              tooltip="Leicht höherer Reifenverschleiß durch Fahrzeuggewicht"
            />
          </div>
          <div className="space-y-3">
            <div className="text-xs font-medium text-amber-700">⛽ Diesel</div>
            <SliderInput
              label="Wartung & Reparatur"
              value={inputs.dieselMaintenancePerKm}
              min={0.01} max={0.30} step={0.005}
              unit="€/km"
              onChange={v => update('dieselMaintenancePerKm', v)}
              tooltip="BGL-Kostentabelle 40t: ~0,08–0,12 €/km inkl. Inspektion, AdBlue, Ölwechsel"
            />
            <SliderInput
              label="Reifen"
              value={inputs.dieselTiresCostPerKm}
              min={0.01} max={0.10} step={0.005}
              unit="€/km"
              onChange={v => update('dieselTiresCostPerKm', v)}
            />
          </div>
        </div>
      </div>

      {/* Maut */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Maut (€/km)
          <span className="ml-2 normal-case text-slate-400 font-normal">Autobahn 40t Sattelzug</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div className="text-xs font-medium text-blue-700">⚡ eLKW</div>
            <SliderInput
              label="Maut-Satz"
              value={inputs.electricTollPerKm}
              min={0} max={0.30} step={0.01}
              unit="€/km"
              onChange={v => update('electricTollPerKm', v)}
              tooltip="Stand 2026: eLKW zahlen Infrastruktur-Toll (~0,06–0,10 €/km), aber KEIN CO₂-Zuschlag (spart ~0,20 €/km vs. Diesel)"
            />
          </div>
          <div className="space-y-3">
            <div className="text-xs font-medium text-amber-700">⛽ Diesel</div>
            <SliderInput
              label="Maut-Satz"
              value={inputs.dieselTollPerKm}
              min={0} max={0.50} step={0.01}
              unit="€/km"
              onChange={v => update('dieselTollPerKm', v)}
              tooltip="Seit Dez. 2023: Infrastruktur + CO₂-Zuschlag. Aktuelle Rate 40t: ca. 0,274 €/km"
            />
          </div>
        </div>
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-800">
          <strong>Mautvorteil eLKW:</strong> {((inputs.dieselTollPerKm - inputs.electricTollPerKm) * inputs.kmPerYear / 1000).toFixed(1).replace('.', ',')} T€/Jahr bei {(inputs.kmPerYear / 1000).toFixed(0)} Tkm
        </div>
      </div>

      {/* Fixkosten jährlich */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Fixkosten (€/Jahr)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div className="text-xs font-medium text-blue-700">⚡ eLKW</div>
            <SliderInput
              label="Versicherung"
              value={inputs.electricInsurancePerYear}
              min={2_000} max={20_000} step={500}
              unit="€/Jahr"
              formatDisplay={formatEuro}
              onChange={v => update('electricInsurancePerYear', v)}
            />
            <SliderInput
              label="Kfz-Steuer"
              value={inputs.electricTaxPerYear}
              min={0} max={5_000} step={100}
              unit="€/Jahr"
              formatDisplay={formatEuro}
              onChange={v => update('electricTaxPerYear', v)}
              tooltip="eLKW derzeit in Deutschland steuerbefreit"
            />
          </div>
          <div className="space-y-3">
            <div className="text-xs font-medium text-amber-700">⛽ Diesel</div>
            <SliderInput
              label="Versicherung"
              value={inputs.dieselInsurancePerYear}
              min={2_000} max={20_000} step={500}
              unit="€/Jahr"
              formatDisplay={formatEuro}
              onChange={v => update('dieselInsurancePerYear', v)}
            />
            <SliderInput
              label="Kfz-Steuer"
              value={inputs.dieselTaxPerYear}
              min={0} max={3_000} step={100}
              unit="€/Jahr"
              formatDisplay={formatEuro}
              onChange={v => update('dieselTaxPerYear', v)}
              tooltip="Ca. 900 €/Jahr für 40t Sattelzug Euro VI"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
