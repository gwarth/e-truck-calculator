import type { TCOInputs } from '../../types'
import { SliderInput } from '../ui/SliderInput'
import { formatNumber } from '../../utils/format'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function UsageSection({ inputs, update }: Props) {
  return (
    <div className="space-y-4 mt-2">
      <SliderInput
        label="Jahresfahrleistung"
        value={inputs.kmPerYear}
        min={30_000} max={250_000} step={5_000}
        unit="km/Jahr"
        formatDisplay={v => `${formatNumber(v)} km`}
        onChange={v => update('kmPerYear', v)}
        tooltip="Fernverkehr: 120.000–160.000 km/Jahr. Verteilerverkehr: 50.000–80.000 km/Jahr"
      />
      <div>
        <SliderInput
          label="Anteil Depot-Laden"
          value={inputs.depotChargingSharePct}
          min={0} max={100} step={5}
          unit="%"
          onChange={v => update('depotChargingSharePct', v)}
          tooltip="Günstigster Strom kommt aus dem Eigendepot. 80 % ist realistisch für Speditionen mit fester Heimatbasis"
        />
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
          <span>Depot {inputs.depotChargingSharePct} %</span>
          <span className="w-3 h-3 rounded-full bg-purple-400 inline-block ml-2"></span>
          <span>Öffentlich {100 - inputs.depotChargingSharePct} %</span>
        </div>
      </div>
    </div>
  )
}
