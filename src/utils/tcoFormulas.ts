import type { TCOInputs, CostBreakdown, TCOResults, YearlyDataPoint } from '../types'

// ─── Financial Math ───────────────────────────────────────────────────────────

/** Annuitätsfaktor: verteilt einmaligen Betrag auf n gleiche Jahresraten */
export function annuityFactor(ratePct: number, years: number): number {
  const r = ratePct / 100
  if (r === 0) return 1 / years
  return r / (1 - Math.pow(1 + r, -years))
}

/** Present Value eines zukünftigen Betrags */
export function presentValue(amount: number, ratePct: number, years: number): number {
  const r = ratePct / 100
  if (r === 0) return amount
  return amount / Math.pow(1 + r, years)
}

/** Jährliche Leasingrate (inkl. Anzahlung auf gesamte Laufzeit verteilt) */
export function annualLeasingCost(monthlyRate: number, downpayment: number, years: number): number {
  return monthlyRate * 12 + downpayment / years
}

// ─── Energy Cost ──────────────────────────────────────────────────────────────

export function annualElectricEnergyCost(inputs: TCOInputs): number {
  const kwhPer100km = inputs.electricConsumptionPer100km
  const kwhPerKm = kwhPer100km / 100
  const depotShare = inputs.depotChargingSharePct / 100
  const blendedPrice =
    depotShare * inputs.depotElectricityPrice +
    (1 - depotShare) * inputs.publicElectricityPrice
  return inputs.kmPerYear * kwhPerKm * blendedPrice
}

export function annualDieselEnergyCost(inputs: TCOInputs): number {
  return inputs.kmPerYear * (inputs.dieselConsumptionPer100km / 100) * inputs.dieselPrice
}

// ─── CAPEX (annualisiert) ────────────────────────────────────────────────────

/** Annualisierte Fahrzeugkosten bei Kauf */
export function annualCapexPurchase(
  purchasePrice: number,
  subsidy: number,
  residualValuePct: number,
  ratePct: number,
  years: number
): number {
  const netCost =
    (purchasePrice - subsidy) -
    presentValue((purchasePrice * residualValuePct) / 100, ratePct, years)
  return netCost * annuityFactor(ratePct, years)
}

/** Annualisierte Infrastrukturkosten */
export function annualInfraCapex(inputs: TCOInputs): number {
  return inputs.depotChargingCapex * annuityFactor(inputs.discountRatePct, inputs.depotChargingLifeYears)
}

// ─── OPEX ────────────────────────────────────────────────────────────────────

export function annualOpexVariable(
  kmPerYear: number,
  maintenancePerKm: number,
  tiresPerKm: number,
  tollPerKm: number
): number {
  return kmPerYear * (maintenancePerKm + tiresPerKm + tollPerKm)
}

export function annualOpexFixed(insurancePerYear: number, taxPerYear: number): number {
  return insurancePerYear + taxPerYear
}

// ─── Full Cost Breakdown ──────────────────────────────────────────────────────

export function computeElectricBreakdown(inputs: TCOInputs): CostBreakdown {
  const n = inputs.timeHorizonYears
  const r = inputs.discountRatePct
  const km = inputs.kmPerYear

  let capexAnnualized: number
  if (inputs.financingMode === 'leasing') {
    capexAnnualized = annualLeasingCost(
      inputs.electricLeasingRateMonthly,
      inputs.electricLeasingDownpayment,
      n
    )
  } else {
    capexAnnualized = annualCapexPurchase(
      inputs.electricPurchasePrice,
      inputs.electricSubsidy,
      inputs.electricResidualValuePct,
      r,
      n
    )
  }

  const infraAnnualized = annualInfraCapex(inputs)
  const energyPerYear = annualElectricEnergyCost(inputs)
  const maintenancePerYear = km * inputs.electricMaintenancePerKm
  const tiresPerYear = km * inputs.electricTiresCostPerKm
  const insurancePerYear = inputs.electricInsurancePerYear
  const taxPerYear = inputs.electricTaxPerYear
  const tollPerYear = km * inputs.electricTollPerKm

  const totalPerYear =
    capexAnnualized +
    infraAnnualized +
    energyPerYear +
    maintenancePerYear +
    tiresPerYear +
    insurancePerYear +
    taxPerYear +
    tollPerYear

  return {
    capexAnnualized,
    energyTotal: energyPerYear * n,
    maintenanceTotal: maintenancePerYear * n,
    tiresTotal: tiresPerYear * n,
    insuranceTotal: insurancePerYear * n,
    taxTotal: taxPerYear * n,
    tollTotal: tollPerYear * n,
    infraAnnualized,
    totalPerYear,
    totalOverHorizon: totalPerYear * n,
    costPerKm: totalPerYear / km,
  }
}

export function computeDieselBreakdown(inputs: TCOInputs): CostBreakdown {
  const n = inputs.timeHorizonYears
  const r = inputs.discountRatePct
  const km = inputs.kmPerYear

  let capexAnnualized: number
  if (inputs.financingMode === 'leasing') {
    capexAnnualized = annualLeasingCost(
      inputs.dieselLeasingRateMonthly,
      inputs.dieselLeasingDownpayment,
      n
    )
  } else {
    capexAnnualized = annualCapexPurchase(
      inputs.dieselPurchasePrice,
      inputs.dieselSubsidy,
      inputs.dieselResidualValuePct,
      r,
      n
    )
  }

  const energyPerYear = annualDieselEnergyCost(inputs)
  const maintenancePerYear = km * inputs.dieselMaintenancePerKm
  const tiresPerYear = km * inputs.dieselTiresCostPerKm
  const insurancePerYear = inputs.dieselInsurancePerYear
  const taxPerYear = inputs.dieselTaxPerYear
  const tollPerYear = km * inputs.dieselTollPerKm

  const totalPerYear =
    capexAnnualized +
    energyPerYear +
    maintenancePerYear +
    tiresPerYear +
    insurancePerYear +
    taxPerYear +
    tollPerYear

  return {
    capexAnnualized,
    energyTotal: energyPerYear * n,
    maintenanceTotal: maintenancePerYear * n,
    tiresTotal: tiresPerYear * n,
    insuranceTotal: insurancePerYear * n,
    taxTotal: taxPerYear * n,
    tollTotal: tollPerYear * n,
    infraAnnualized: 0,
    totalPerYear,
    totalOverHorizon: totalPerYear * n,
    costPerKm: totalPerYear / km,
  }
}

// ─── Yearly Cash-Flow für Chart ───────────────────────────────────────────────

function cashFlowYearlyData(
  electricAnnual: number,
  dieselAnnual: number,
  years: number
): YearlyDataPoint[] {
  const data: YearlyDataPoint[] = []
  let eCum = 0
  let dCum = 0
  for (let y = 1; y <= years; y++) {
    eCum += electricAnnual
    dCum += dieselAnnual
    data.push({
      year: y,
      electricCumulative: eCum,
      dieselCumulative: dCum,
      electricAnnual,
      dieselAnnual,
    })
  }
  return data
}

function findBreakEven(yearlyData: YearlyDataPoint[]): number | null {
  for (const d of yearlyData) {
    if (d.electricCumulative <= d.dieselCumulative) return d.year
  }
  return null
}

// ─── CO₂ ─────────────────────────────────────────────────────────────────────

export function computeCO2Saved(inputs: TCOInputs): number {
  const litersPerYear = inputs.kmPerYear * (inputs.dieselConsumptionPer100km / 100)
  const co2PerLiter = 2.65 // kg WTW
  return litersPerYear * inputs.timeHorizonYears * co2PerLiter
}

// ─── Main Compute Function ────────────────────────────────────────────────────

export function computeTCO(inputs: TCOInputs): TCOResults {
  const electric = computeElectricBreakdown(inputs)
  const diesel = computeDieselBreakdown(inputs)

  const yearlyData = cashFlowYearlyData(
    electric.totalPerYear,
    diesel.totalPerYear,
    inputs.timeHorizonYears
  )

  const breakEvenYear = findBreakEven(yearlyData)

  const savingsTotal = diesel.totalOverHorizon - electric.totalOverHorizon
  const savingsPct = (savingsTotal / diesel.totalOverHorizon) * 100

  const co2SavedKg = computeCO2Saved(inputs)

  // Dieselzuschlag-Risiko
  let dieselFuelRiskPerYear = 0
  if (inputs.fuelSurchargeEnabled) {
    const annualFuelCost = annualDieselEnergyCost(inputs)
    const delta = Math.max(0, inputs.dieselPrice - inputs.fuelSurchargeBaseDieselPrice)
    const surchargeRate = (delta / 0.10) * 0.015
    const unrecoveredShare = 1 - inputs.fuelSurchargePassthroughPct / 100
    dieselFuelRiskPerYear = annualFuelCost * surchargeRate * unrecoveredShare
  }

  return {
    electric,
    diesel,
    savingsTotal,
    savingsPct,
    breakEvenYear,
    co2SavedKg,
    yearlyData,
    dieselFuelRiskPerYear,
  }
}
