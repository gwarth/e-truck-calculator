import type { ElectricTruckPreset, DieselTruckPreset, TCOInputs } from '../types'

// ─── Electric Truck Presets ──────────────────────────────────────────────────

export const ELECTRIC_PRESETS: ElectricTruckPreset[] = [
  {
    id: 'daf-xf-electric',
    name: 'DAF XF Electric 350E',
    manufacturer: 'DAF',
    purchasePrice: 390_000,
    consumptionPer100km: 114,         // Realdaten: 3.091 kWh / 2.708 km (Tobias Wagner)
    batteryCapacityKwh: 540,
    batteryUsableKwh: 486,            // 90 % nutzbar
    maxChargingKw: 350,               // CCS2
    chargingStandard: 'CCS2',
    rangeKm: 426,                     // 486 kWh / 1.14 kWh/km
  },
  {
    id: 'mercedes-eactros-600',
    name: 'Mercedes-Benz eActros 600',
    manufacturer: 'Mercedes-Benz',
    purchasePrice: 450_000,
    consumptionPer100km: 135,
    batteryCapacityKwh: 621,
    batteryUsableKwh: 559,
    maxChargingKw: 1_000,             // MCS (Megawatt Charging System)
    chargingStandard: 'MCS',
    rangeKm: 414,
  },
  {
    id: 'volvo-fh-electric',
    name: 'Volvo FH Electric',
    manufacturer: 'Volvo',
    purchasePrice: 420_000,
    consumptionPer100km: 150,
    batteryCapacityKwh: 540,
    batteryUsableKwh: 486,
    maxChargingKw: 250,               // CCS2
    chargingStandard: 'CCS2',
    rangeKm: 324,
  },
]

// ─── Diesel Truck Presets ────────────────────────────────────────────────────

export const DIESEL_PRESETS: DieselTruckPreset[] = [
  {
    id: 'daf-xg-480',
    name: 'DAF XG+ 480',
    manufacturer: 'DAF',
    purchasePrice: 160_000,
    consumptionPer100km: 26.8,        // Realdaten: 726 L / 2.708 km
    co2PerLiterKg: 2.65,              // WTW inkl. Vorproduktion
  },
  {
    id: 'mercedes-actros-1848',
    name: 'Mercedes-Benz Actros 1848',
    manufacturer: 'Mercedes-Benz',
    purchasePrice: 155_000,
    consumptionPer100km: 28.5,
    co2PerLiterKg: 2.65,
  },
  {
    id: 'volvo-fh-460',
    name: 'Volvo FH 460',
    manufacturer: 'Volvo',
    purchasePrice: 162_000,
    consumptionPer100km: 27.5,
    co2PerLiterKg: 2.65,
  },
]

// ─── Default Inputs ──────────────────────────────────────────────────────────

export const DEFAULT_INPUTS: TCOInputs = {
  // Vehicle selection
  electricVehicleId: 'daf-xf-electric',
  dieselVehicleId: 'daf-xg-480',

  // Financing
  financingMode: 'leasing',

  // Electric vehicle finances
  electricPurchasePrice: 390_000,
  electricSubsidy: 40_000,           // typische Bundesförderung DE 2024/25
  electricLeasingRateMonthly: 4_200, // ca. Full-Service-Leasing 5 Jahre
  electricLeasingDownpayment: 50_000,
  electricResidualValuePct: 25,

  // Diesel vehicle finances
  dieselPurchasePrice: 160_000,
  dieselSubsidy: 0,
  dieselLeasingRateMonthly: 1_900,
  dieselLeasingDownpayment: 20_000,
  dieselResidualValuePct: 30,

  // Financing rate
  financingRatePct: 4.5,

  // Technical (mirrors preset defaults, overridable)
  electricConsumptionPer100km: 114,
  dieselConsumptionPer100km: 26.8,

  // Usage profile
  kmPerYear: 120_000,
  depotChargingSharePct: 80,

  // Energy costs
  depotElectricityPrice: 0.22,
  publicElectricityPrice: 0.55,
  dieselPrice: 1.70,

  // OPEX per km
  electricMaintenancePerKm: 0.05,    // ~50 % günstiger als Diesel (ACEA)
  dieselMaintenancePerKm: 0.10,      // BGL-Richtwert 40t
  electricTiresCostPerKm: 0.04,      // höherer Reifenverschleiß durch Gewicht
  dieselTiresCostPerKm: 0.04,

  // OPEX annual fixed
  electricInsurancePerYear: 8_500,
  dieselInsurancePerYear: 7_500,
  electricTaxPerYear: 0,             // eLKW in DE steuerfrei
  dieselTaxPerYear: 900,             // ca. Kfz-Steuer 40t

  // Maut (Stand 2026: eLKW zahlt Infrastrukturanteil, kein CO₂-Zuschlag)
  electricTollPerKm: 0.08,
  dieselTollPerKm: 0.274,            // inkl. CO₂-Zuschlag seit Dez. 2023

  // Infrastructure
  depotChargingCapex: 80_000,        // 150kW DC Wallbox + Netzanschluss
  depotChargingLifeYears: 10,

  // Financial model
  timeHorizonYears: 5,
  discountRatePct: 5,

  // Fuel surcharge
  fuelSurchargeEnabled: true,
  fuelSurchargeBaseDieselPrice: 1.20,
  fuelSurchargePassthroughPct: 70,

  // Driving simulation
  simTargetKm: 800,
  simAvgSpeedKmh: 80,
  simDriverMode: '1-Fahrer',
  simStartSocPct: 100,
  simMinSocPct: 15,
}
