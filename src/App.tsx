import { useState } from 'react'
import { Truck, Zap, BarChart2, Gauge, Fuel, Settings, Route, TrendingDown } from 'lucide-react'
import { DEFAULT_INPUTS } from './data/presets'
import type { TCOInputs } from './types'
import { useTCOCalculation } from './hooks/useTCOCalculation'
import { useDrivingSimulation } from './hooks/useDrivingSimulation'

// Layout
import { Header } from './components/layout/Header'

// UI Primitives
import { AccordionSection } from './components/ui/AccordionSection'

// Input Sections
import { VehicleSelector } from './components/inputs/VehicleSelector'
import { FinancingSection } from './components/inputs/FinancingSection'
import { UsageSection } from './components/inputs/UsageSection'
import { EnergyCostsSection } from './components/inputs/EnergyCostsSection'
import { OpexSection } from './components/inputs/OpexSection'
import { InfrastructureSection } from './components/inputs/InfrastructureSection'
import { FuelSurchargeSection } from './components/inputs/FuelSurchargeSection'
import { DrivingSimSection } from './components/inputs/DrivingSimSection'

// Result Components
import { CostPerKmCard } from './components/results/CostPerKmCard'
import { BreakevenCard } from './components/results/BreakevenCard'
import { TCOBreakdownTable } from './components/results/TCOBreakdownTable'
import { CumulativeCostChart } from './components/results/CumulativeCostChart'
import { SavingsSummary } from './components/results/SavingsSummary'
import { DrivingTimeline } from './components/results/DrivingTimeline'

export default function App() {
  const [inputs, setInputs] = useState<TCOInputs>(DEFAULT_INPUTS)

  function update<K extends keyof TCOInputs>(key: K, value: TCOInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  const results = useTCOCalculation(inputs)
  const simResults = useDrivingSimulation(inputs)

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

          {/* ── Left Column: Inputs ─────────────────────────────── */}
          <div className="space-y-3">
            <AccordionSection
              title="Fahrzeugauswahl"
              subtitle="eLKW-Modell und Diesel-Referenzfahrzeug"
              icon={<Truck className="w-4 h-4" />}
              defaultOpen
            >
              <VehicleSelector inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Finanzierung & Laufzeit"
              subtitle="Leasing oder Kauf, Förderung, Restwert"
              icon={<BarChart2 className="w-4 h-4" />}
              defaultOpen
            >
              <FinancingSection inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Einsatzprofil"
              subtitle="Jahreskilometer, Depot- vs. öffentliches Laden"
              icon={<Route className="w-4 h-4" />}
              defaultOpen
            >
              <UsageSection inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Energiekosten"
              subtitle="Strom (Depot & öffentlich), Dieselpreis"
              icon={<Zap className="w-4 h-4" />}
              defaultOpen
            >
              <EnergyCostsSection inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Betriebskosten (OPEX)"
              subtitle="Wartung, Reifen, Maut, Versicherung, Kfz-Steuer"
              icon={<Settings className="w-4 h-4" />}
            >
              <OpexSection inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Ladeinfrastruktur"
              subtitle="Depot-CAPEX, Abschreibung"
              icon={<Zap className="w-4 h-4" />}
            >
              <InfrastructureSection inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Dieselzuschlag & Preisrisiko"
              subtitle="DSLV-Referenztabelle, Risikoanalyse für Spediteure"
              icon={<Fuel className="w-4 h-4" />}
              badge="Branchenspezifisch"
            >
              <FuelSurchargeSection inputs={inputs} update={update} />
            </AccordionSection>

            <AccordionSection
              title="Fahrzeitensimulation"
              subtitle="EU-VO 561/2006 · Welche Fahrzeuge kommen ohne Extra-Stopp ans Ziel?"
              icon={<Gauge className="w-4 h-4" />}
              badge="NEU"
            >
              <DrivingSimSection inputs={inputs} update={update} />
            </AccordionSection>
          </div>

          {/* ── Right Column: Results (sticky) ──────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <CostPerKmCard results={results} />
            <BreakevenCard results={results} timeHorizon={inputs.timeHorizonYears} />
            <CumulativeCostChart results={results} timeHorizon={inputs.timeHorizonYears} />
            <TCOBreakdownTable results={results} timeHorizon={inputs.timeHorizonYears} />
            <SavingsSummary
              results={results}
              dieselFuelRisk={results.dieselFuelRiskPerYear}
              fuelSurchargeEnabled={inputs.fuelSurchargeEnabled}
            />

            {/* CTA Lead */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 font-bold mb-2">
                <TrendingDown className="w-5 h-5" />
                Ladeinfrastruktur für Ihre Flotte
              </div>
              <p className="text-sm text-blue-100 mb-4">
                Dieser Rechner zeigt die Einzelfahrzeugperspektive.
                Für eine vollständige Flottenanalyse inkl. Infrastruktur-Businesscase kontaktieren Sie uns.
              </p>
              <a
                href="mailto:kontakt@example.com?subject=Flottenanalyse%20eLKW%20Ladeinfrastruktur"
                className="inline-block bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Flottenanalyse anfragen →
              </a>
            </div>
          </div>
        </div>

        {/* ── Full-width: Driving Simulation Results ───────────── */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
          <DrivingTimeline
            results={simResults}
            driverMode={inputs.simDriverMode}
            targetKm={inputs.simTargetKm}
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-400 space-y-1 pb-8">
          <p>
            Alle Angaben ohne Gewähr. Quellen: BGL-Kostentabellen, ACEA, DSLV, EU-VO 561/2006.
            Verbrauchswert DAF XF Electric basiert auf Realdaten Tobias Wagner (Spedition Nanno Janssen), Skandinavien-Tour April 2026.
          </p>
          <p>Kein Fahrerlohn enthalten · Alle Preise netto (ohne MwSt.)</p>
        </footer>
      </div>
    </div>
  )
}
