// ─── Vehicle Presets ────────────────────────────────────────────────────────

export interface ElectricTruckPreset {
  id: string
  name: string
  manufacturer: string
  purchasePrice: number          // €
  consumptionPer100km: number    // kWh/100km
  batteryCapacityKwh: number     // total kWh
  batteryUsableKwh: number       // 90% of total
  maxChargingKw: number          // peak DC charging power
  chargingStandard: 'CCS2' | 'MCS'
  rangeKm: number                // realistic range (usable battery / consumption)
}

export interface DieselTruckPreset {
  id: string
  name: string
  manufacturer: string
  purchasePrice: number          // €
  consumptionPer100km: number    // L/100km
  co2PerLiterKg: number          // kg CO2 per liter (WTW)
}

// ─── TCO Inputs ─────────────────────────────────────────────────────────────

export type FinancingMode = 'kauf' | 'leasing'

export interface TCOInputs {
  // Vehicle selection
  electricVehicleId: string
  dieselVehicleId: string

  // Financing mode
  financingMode: FinancingMode

  // Purchase / Leasing — Electric
  electricPurchasePrice: number       // €
  electricSubsidy: number             // € Förderung
  electricLeasingRateMonthly: number  // € / Monat (bei Leasing)
  electricLeasingDownpayment: number  // € Anzahlung (bei Leasing)
  electricResidualValuePct: number    // % des Kaufpreises am Ende

  // Purchase / Leasing — Diesel
  dieselPurchasePrice: number
  dieselSubsidy: number
  dieselLeasingRateMonthly: number
  dieselLeasingDownpayment: number
  dieselResidualValuePct: number

  // Financing
  financingRatePct: number            // Zinssatz % p.a.

  // Vehicle technical (overridable)
  electricConsumptionPer100km: number // kWh
  dieselConsumptionPer100km: number   // L

  // Usage profile
  kmPerYear: number
  depotChargingSharePct: number       // % der Energie die im Depot geladen wird

  // Energy costs
  depotElectricityPrice: number       // €/kWh
  publicElectricityPrice: number      // €/kWh
  dieselPrice: number                 // €/L (netto)

  // OPEX (per km)
  electricMaintenancePerKm: number    // €/km
  dieselMaintenancePerKm: number
  electricTiresCostPerKm: number
  dieselTiresCostPerKm: number

  // OPEX (annual fixed)
  electricInsurancePerYear: number    // €/Jahr
  dieselInsurancePerYear: number
  electricTaxPerYear: number          // Kfz-Steuer
  dieselTaxPerYear: number

  // Toll / Maut
  electricTollPerKm: number           // €/km
  dieselTollPerKm: number

  // Infrastructure
  depotChargingCapex: number          // € einmalig
  depotChargingLifeYears: number      // Nutzungsdauer für Abschreibung

  // Financial model
  timeHorizonYears: number            // 1–10
  discountRatePct: number             // WACC %

  // Fuel surcharge inputs
  fuelSurchargeEnabled: boolean
  fuelSurchargeBaseDieselPrice: number  // €/L Basisdieselpreis (vertraglich)
  fuelSurchargePassthroughPct: number   // % die wirklich durchsetzbar sind

  // Driving simulation inputs
  simTargetKm: number                 // Ziel-km der simulierten Tour
  simAvgSpeedKmh: number
  simDriverMode: '1-Fahrer' | '2-Fahrer'
  simStartSocPct: number              // Startladung %
  simMinSocPct: number                // Sicherheitspuffer %
}

// ─── TCO Results ────────────────────────────────────────────────────────────

export interface CostBreakdown {
  capexAnnualized: number         // € / Jahr (Fahrzeug, annualisiert)
  energyTotal: number             // € über gesamten Zeitraum
  maintenanceTotal: number
  tiresTotal: number
  insuranceTotal: number
  taxTotal: number
  tollTotal: number
  infraAnnualized: number         // € / Jahr (nur eLKW)
  totalPerYear: number
  totalOverHorizon: number
  costPerKm: number               // €/km
}

export interface YearlyDataPoint {
  year: number
  electricCumulative: number
  dieselCumulative: number
  electricAnnual: number
  dieselAnnual: number
}

export interface TCOResults {
  electric: CostBreakdown
  diesel: CostBreakdown
  savingsTotal: number            // positiv = eLKW günstiger
  savingsPct: number              // % günstiger
  breakEvenYear: number | null    // null = kein Break-even im Zeitraum
  co2SavedKg: number
  yearlyData: YearlyDataPoint[]
  // Fuel surcharge risk
  dieselFuelRiskPerYear: number   // ungedecktes Preisrisiko Diesel
}

// ─── Driving Simulation ──────────────────────────────────────────────────────

export interface ChargingStop {
  timeH: number                   // Stunden ab Abfahrt
  kmAtStop: number
  durationMin: number
  socBefore: number               // % SOC vor Laden
  socAfter: number                // % SOC nach Laden
  isMandatoryBreak: boolean       // fällt mit Pflichtpause zusammen?
}

export interface MandatoryBreak {
  timeH: number
  durationMin: number
  type: '45min' | '11h-rest' | '9h-rest'
}

export interface SocDataPoint {
  timeH: number
  socPct: number
  kmDriven: number
  phase: 'driving' | 'charging' | 'break' | 'rest'
}

export interface SimResult {
  vehicleId: string
  vehicleName: string
  feasible: boolean
  totalTimeH: number
  totalDrivingH: number
  extraChargingStops: number      // Ladestopps die NICHT mit Pflichtpause zusammenfallen
  extraChargingMinutes: number    // Gesamter Zeitverlust durch Extra-Stopps
  chargingStops: ChargingStop[]
  mandatoryBreaks: MandatoryBreak[]
  socProfile: SocDataPoint[]
  statusLabel: 'ok' | 'extra-stop' | 'not-feasible'
}
