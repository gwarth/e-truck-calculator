import { Truck, Zap, Info } from 'lucide-react'
import { ELECTRIC_PRESETS, DIESEL_PRESETS } from '../../data/presets'
import type { TCOInputs } from '../../types'
import { formatEuro } from '../../utils/format'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function VehicleSelector({ inputs, update }: Props) {
  const selectedElectric = ELECTRIC_PRESETS.find(p => p.id === inputs.electricVehicleId)
  const selectedDiesel = DIESEL_PRESETS.find(p => p.id === inputs.dieselVehicleId)

  function onSelectElectric(id: string) {
    const preset = ELECTRIC_PRESETS.find(p => p.id === id)
    if (!preset) return
    update('electricVehicleId', id)
    update('electricPurchasePrice', preset.purchasePrice)
    update('electricConsumptionPer100km', preset.consumptionPer100km)
  }

  function onSelectDiesel(id: string) {
    const preset = DIESEL_PRESETS.find(p => p.id === id)
    if (!preset) return
    update('dieselVehicleId', id)
    update('dieselPurchasePrice', preset.purchasePrice)
    update('dieselConsumptionPer100km', preset.consumptionPer100km)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
      {/* eLKW */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
          <Zap className="w-4 h-4" /> Elektro-LKW
        </div>
        <select
          value={inputs.electricVehicleId}
          onChange={e => onSelectElectric(e.target.value)}
          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {ELECTRIC_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedElectric && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Kaufpreis (UVP)</span>
              <span className="font-medium">{formatEuro(selectedElectric.purchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Verbrauch</span>
              <span className="font-medium">{selectedElectric.consumptionPer100km} kWh/100km</span>
            </div>
            <div className="flex justify-between">
              <span>Batterie</span>
              <span className="font-medium">{selectedElectric.batteryCapacityKwh} kWh</span>
            </div>
            <div className="flex justify-between">
              <span>Max. Ladeleistung</span>
              <span className="font-medium">{selectedElectric.maxChargingKw >= 1000
                ? `${selectedElectric.maxChargingKw / 1000} MW (MCS)`
                : `${selectedElectric.maxChargingKw} kW`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Reichweite (real)</span>
              <span className="font-medium">{selectedElectric.rangeKm} km</span>
            </div>
          </div>
        )}
        {/* Manuelle Überschreibung */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> Werte manuell anpassen:
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 w-32 shrink-0">Kaufpreis (€)</label>
            <input
              type="number"
              value={inputs.electricPurchasePrice}
              step={1000}
              onChange={e => update('electricPurchasePrice', Number(e.target.value))}
              className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 w-32 shrink-0">Verbrauch (kWh/100km)</label>
            <input
              type="number"
              value={inputs.electricConsumptionPer100km}
              step={1}
              onChange={e => update('electricConsumptionPer100km', Number(e.target.value))}
              className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Diesel */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
          <Truck className="w-4 h-4" /> Diesel-LKW (Referenz)
        </div>
        <select
          value={inputs.dieselVehicleId}
          onChange={e => onSelectDiesel(e.target.value)}
          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          {DIESEL_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedDiesel && (
          <div className="bg-amber-50 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Kaufpreis (UVP)</span>
              <span className="font-medium">{formatEuro(selectedDiesel.purchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Verbrauch</span>
              <span className="font-medium">{selectedDiesel.consumptionPer100km} L/100km</span>
            </div>
            <div className="flex justify-between">
              <span>CO₂ (WTW)</span>
              <span className="font-medium">{selectedDiesel.co2PerLiterKg} kg/L</span>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> Werte manuell anpassen:
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 w-32 shrink-0">Kaufpreis (€)</label>
            <input
              type="number"
              value={inputs.dieselPurchasePrice}
              step={1000}
              onChange={e => update('dieselPurchasePrice', Number(e.target.value))}
              className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 w-32 shrink-0">Verbrauch (L/100km)</label>
            <input
              type="number"
              value={inputs.dieselConsumptionPer100km}
              step={0.1}
              onChange={e => update('dieselConsumptionPer100km', Number(e.target.value))}
              className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
