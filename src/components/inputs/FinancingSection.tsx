import { Zap, Truck } from 'lucide-react'
import type { TCOInputs, FinancingMode } from '../../types'
import { SliderInput } from '../ui/SliderInput'
import { formatEuro } from '../../utils/format'

interface Props {
  inputs: TCOInputs
  update: <K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) => void
}

export function FinancingSection({ inputs, update }: Props) {
  const isLeasing = inputs.financingMode === 'leasing'

  return (
    <div className="space-y-5 mt-2">
      {/* Toggle Kauf / Leasing */}
      <div className="flex rounded-lg overflow-hidden border border-slate-300 w-fit">
        {(['leasing', 'kauf'] as FinancingMode[]).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => update('financingMode', mode)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              inputs.financingMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {mode === 'leasing' ? '📋 Full-Service-Leasing' : '💰 Kauf / Finanzierung'}
          </button>
        ))}
      </div>

      {isLeasing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* eLKW Leasing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <Zap className="w-4 h-4" /> eLKW
            </div>
            <SliderInput
              label="Monatliche Leasingrate"
              value={inputs.electricLeasingRateMonthly}
              min={1000} max={8000} step={100}
              unit="€/Monat"
              onChange={v => update('electricLeasingRateMonthly', v)}
              tooltip="Full-Service-Leasing inkl. Wartung & Reifen. Richtwert 40t eLKW: 3.800–5.500 €/Monat"
            />
            <SliderInput
              label="Anzahlung"
              value={inputs.electricLeasingDownpayment}
              min={0} max={150_000} step={5_000}
              unit="€"
              formatDisplay={formatEuro}
              onChange={v => update('electricLeasingDownpayment', v)}
            />
            <SliderInput
              label="Förderung / Zuschuss"
              value={inputs.electricSubsidy}
              min={0} max={100_000} step={5_000}
              unit="€"
              formatDisplay={formatEuro}
              onChange={v => update('electricSubsidy', v)}
              tooltip="z.B. BMDV KsNI-Förderung, Bundesamt für Güterverkehr"
            />
          </div>
          {/* Diesel Leasing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <Truck className="w-4 h-4" /> Diesel
            </div>
            <SliderInput
              label="Monatliche Leasingrate"
              value={inputs.dieselLeasingRateMonthly}
              min={500} max={4000} step={100}
              unit="€/Monat"
              onChange={v => update('dieselLeasingRateMonthly', v)}
              tooltip="Full-Service-Leasing 40t Diesel: 1.600–2.500 €/Monat"
            />
            <SliderInput
              label="Anzahlung"
              value={inputs.dieselLeasingDownpayment}
              min={0} max={80_000} step={5_000}
              unit="€"
              formatDisplay={formatEuro}
              onChange={v => update('dieselLeasingDownpayment', v)}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* eLKW Kauf */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <Zap className="w-4 h-4" /> eLKW
            </div>
            <SliderInput
              label="Kaufpreis"
              value={inputs.electricPurchasePrice}
              min={200_000} max={700_000} step={10_000}
              unit="€"
              formatDisplay={formatEuro}
              onChange={v => update('electricPurchasePrice', v)}
            />
            <SliderInput
              label="Förderung / Zuschuss"
              value={inputs.electricSubsidy}
              min={0} max={100_000} step={5_000}
              unit="€"
              formatDisplay={formatEuro}
              onChange={v => update('electricSubsidy', v)}
              tooltip="z.B. BMDV KsNI-Förderung"
            />
            <SliderInput
              label="Restwert nach Laufzeit"
              value={inputs.electricResidualValuePct}
              min={5} max={60} step={5}
              unit="%"
              onChange={v => update('electricResidualValuePct', v)}
            />
          </div>
          {/* Diesel Kauf */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <Truck className="w-4 h-4" /> Diesel
            </div>
            <SliderInput
              label="Kaufpreis"
              value={inputs.dieselPurchasePrice}
              min={100_000} max={300_000} step={5_000}
              unit="€"
              formatDisplay={formatEuro}
              onChange={v => update('dieselPurchasePrice', v)}
            />
            <SliderInput
              label="Restwert nach Laufzeit"
              value={inputs.dieselResidualValuePct}
              min={5} max={60} step={5}
              unit="%"
              onChange={v => update('dieselResidualValuePct', v)}
            />
          </div>
        </div>
      )}

      {/* Gemeinsame Parameter */}
      <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SliderInput
          label="Zinssatz / Leasingkostensatz"
          value={inputs.financingRatePct}
          min={0} max={12} step={0.5}
          unit="% p.a."
          onChange={v => update('financingRatePct', v)}
          tooltip="Effektivzins für Finanzierung / kalkulatorischer Zinssatz bei Leasing"
        />
        <SliderInput
          label="Betrachtungszeitraum"
          value={inputs.timeHorizonYears}
          min={1} max={10} step={1}
          unit="Jahre"
          onChange={v => update('timeHorizonYears', v)}
          tooltip="Standard in der Branche: 4–5 Jahre (Leasing-Rhythmus)"
        />
      </div>
    </div>
  )
}
