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
    maxChargingKw: 350,               // CCS2 peak
    chargingStandard: 'CCS2',
    rangeKm: 426,                     // 486 kWh / 1.14 kWh/km
    // Ladekurve: Peak 320 kW, nach ~10 min Abfall auf 265 kW ab ~50% SOC
    chargingCurve: [
      { untilSocPct: 50, powerKw: 320 },
      { untilSocPct: 80, powerKw: 265 },
      { untilSocPct: 90, powerKw: 180 },
    ],
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
    // MCS: sehr flache Kurve bis ~80%, dann Abfall
    chargingCurve: [
      { untilSocPct: 80, powerKw: 900 },
      { untilSocPct: 90, powerKw: 500 },
    ],
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
    chargingCurve: [
      { untilSocPct: 70, powerKw: 250 },
      { untilSocPct: 85, powerKw: 180 },
      { untilSocPct: 90, powerKw: 120 },
    ],
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
  electricVehicleId: 'daf-xf-electric',
  dieselVehicleId: 'daf-xg-480',

  financingMode: 'leasing',

  electricPurchasePrice: 390_000,
  electricSubsidy: 40_000,
  electricLeasingRateMonthly: 4_200,
  electricLeasingDownpayment: 50_000,
  electricResidualValuePct: 25,

  dieselPurchasePrice: 160_000,
  dieselSubsidy: 0,
  dieselLeasingRateMonthly: 1_900,
  dieselLeasingDownpayment: 20_000,
  dieselResidualValuePct: 30,

  financingRatePct: 4.5,

  electricConsumptionPer100km: 114,
  dieselConsumptionPer100km: 26.8,

  kmPerYear: 120_000,
  depotChargingSharePct: 80,

  depotElectricityPrice: 0.22,
  publicElectricityPrice: 0.55,
  dieselPrice: 1.70,

  electricMaintenancePerKm: 0.05,
  dieselMaintenancePerKm: 0.10,
  electricTiresCostPerKm: 0.04,
  dieselTiresCostPerKm: 0.04,

  electricInsurancePerYear: 8_500,
  dieselInsurancePerYear: 7_500,
  electricTaxPerYear: 0,
  dieselTaxPerYear: 900,

  electricTollPerKm: 0.08,
  dieselTollPerKm: 0.274,

  depotChargingCapex: 80_000,
  depotChargingLifeYears: 10,

  timeHorizonYears: 5,
  discountRatePct: 5,

  fuelSurchargeEnabled: true,
  fuelSurchargeBaseDieselPrice: 1.20,
  fuelSurchargePassthroughPct: 70,

  simTargetKm: 800,
  simAvgSpeedKmh: 80,
  simDriverMode: '1-Fahrer',
  simStartSocPct: 100,
  simMinSocPct: 15,
}
