import type { TCOInputs } from '../../types'
import { SliderInput } from '../ui/SliderInput'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function EnergyCostsSection({ inputs, update }: Props) {
  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">⚡ Strom</div>
          <SliderInput
            label="Depot-Strom"
            value={inputs.depotElectricityPrice}
            min={0.05} max={0.60} step={0.01}
            unit="€/kWh"
            onChange={v => update('depotElectricityPrice', v)}
            tooltip="Gewerbestrom inkl. Netzentgelte. Mit PPA oder eigener PV: ab 0,10–0,18 €/kWh möglich"
          />
          <SliderInput
            label="Öffentliches Laden (HPC)"
            value={inputs.publicElectricityPrice}
            min={0.25} max={1.20} step={0.05}
            unit="€/kWh"
            onChange={v => update('publicElectricityPrice', v)}
            tooltip="Ohne bilaterale Ladevertrag: 0,45–0,75 €/kWh. Mit Rahmenvertrag (z.B. Shell, IONITY): 0,35–0,50 €/kWh"
          />
        </div>
        <div className="space-y-4">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">⛽ Diesel</div>
          <SliderInput
            label="Dieselpreis (netto)"
            value={inputs.dieselPrice}
            min={0.80} max={3.00} step={0.05}
            unit="€/L"
            onChange={v => update('dieselPrice', v)}
            tooltip="Netto-Einkaufspreis (ohne MwSt.). Spotpreis DE Frühjahr 2026: ca. 1,60–1,80 €/L netto"
          />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
            <div className="font-medium">ETS2-Ausblick ab 2027</div>
            <div>CO₂-Bepreisung im Straßenverkehr erwartet: +0,10 bis +0,25 €/L. Erhöht Diesel-Preisrisiko strukturell.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
