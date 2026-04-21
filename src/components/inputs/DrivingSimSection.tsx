import type { TCOInputs } from '../../types'
import { SliderInput } from '../ui/SliderInput'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function DrivingSimSection({ inputs, update }: Props) {
  return (
    <div className="space-y-4 mt-2">
      <p className="text-xs text-slate-500">
        Simuliert eine Tour nach EU-VO 561/2006 (Lenkzeit- & Ruhevorschriften).
        Zeigt welche Fahrzeuge ohne Extra-Ladestopps ans Ziel kommen.
      </p>

      {/* Fahrermodus Toggle */}
      <div>
        <div className="text-xs font-medium text-slate-600 mb-2">Betriebsmodus</div>
        <div className="flex rounded-lg overflow-hidden border border-slate-300 w-fit">
          {(['1-Fahrer', '2-Fahrer'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => update('simDriverMode', mode)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                inputs.simDriverMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {mode === '1-Fahrer' ? '👤 1-Fahrer' : '👥 2-Fahrer (Doppelbesatzung)'}
            </button>
          ))}
        </div>
        {inputs.simDriverMode === '2-Fahrer' && (
          <div className="mt-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded p-2">
            2-Fahrer: Pausen werden im Fahrzeug genommen. Laden muss aktiv geplant werden —
            Fahrzeuge ohne schnelle Ladeleistung (z.B. MCS) sind im Nachteil.
          </div>
        )}
      </div>

      <SliderInput
        label="Ziel-Distanz der Tour"
        value={inputs.simTargetKm}
        min={100} max={2000} step={50}
        unit="km"
        onChange={v => update('simTargetKm', v)}
        tooltip="Typische Fernverkehrs-Tagesetappe: 700–900 km"
      />
      <SliderInput
        label="Ø-Reisegeschwindigkeit"
        value={inputs.simAvgSpeedKmh}
        min={60} max={100} step={5}
        unit="km/h"
        onChange={v => update('simAvgSpeedKmh', v)}
        tooltip="Durchschnitt inkl. Verkehr. Autobahn LKW: 75–85 km/h"
      />
      <SliderInput
        label="Start-Ladestand"
        value={inputs.simStartSocPct}
        min={50} max={100} step={5}
        unit="%"
        onChange={v => update('simStartSocPct', v)}
      />
      <SliderInput
        label="Sicherheitspuffer (min. SOC)"
        value={inputs.simMinSocPct}
        min={5} max={30} step={5}
        unit="%"
        onChange={v => update('simMinSocPct', v)}
        tooltip="Puffer damit Fahrer nie mit leerem Akku stehen bleibt. 15–20 % empfohlen"
      />
    </div>
  )
}
