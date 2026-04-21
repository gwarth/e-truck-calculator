/**
 * Dieselzuschlag-Logik nach DSLV/BGL-Referenztabelle.
 *
 * Speditionen vereinbaren einen Basis-Dieselpreis mit Kunden.
 * Überschreitet der Marktpreis diesen Basispreis, darf ein Zuschlag
 * auf die Frachtrate erhoben werden. In der Praxis ist dieser jedoch
 * nicht immer vollständig durchsetzbar (Wettbewerbsdruck).
 */

export interface SurchargeResult {
  surchargeRatePct: number       // % Aufschlag auf Frachtrate
  recoveredCostPerYear: number   // € die tatsächlich durchgesetzt werden
  unrecoveredRiskPerYear: number // € die der Spediteur selbst trägt
  totalRiskPerYear: number       // Gesamtes Preisrisiko (unabh. von Durchsetzbarkeit)
}

/**
 * Berechnet das Dieselpreisrisiko für einen Diesel-Betreiber.
 *
 * @param currentDieselPrice    Aktueller Dieselpreis €/L
 * @param baseDieselPrice       Vertraglich vereinbarter Basispreis €/L
 * @param annualFuelCost        Jährliche Kraftstoffkosten €
 * @param passthroughPct        Anteil der wirklich durchgesetzt werden kann (0–100 %)
 */
export function computeSurcharge(
  currentDieselPrice: number,
  baseDieselPrice: number,
  annualFuelCost: number,
  passthroughPct: number
): SurchargeResult {
  const delta = Math.max(0, currentDieselPrice - baseDieselPrice)

  // DSLV vereinfacht: je 0,10 €/L über Basis ≈ 1,5 % Aufschlag
  const surchargeRatePct = (delta / 0.10) * 1.5

  const totalRiskPerYear = annualFuelCost * (surchargeRatePct / 100)
  const recoveredCostPerYear = totalRiskPerYear * (passthroughPct / 100)
  const unrecoveredRiskPerYear = totalRiskPerYear * (1 - passthroughPct / 100)

  return {
    surchargeRatePct,
    recoveredCostPerYear,
    unrecoveredRiskPerYear,
    totalRiskPerYear,
  }
}

/**
 * Berechnet wie sich das Preisrisiko bei verschiedenen Dieselszenarien entwickelt.
 * Nützlich für die "Was-wenn-Analyse" im Rechner.
 */
export function surchargeScenarios(
  baseDieselPrice: number,
  currentDieselPrice: number,
  annualFuelCost: number,
  passthroughPct: number
): Array<{ label: string; dieselPrice: number; result: SurchargeResult }> {
  const scenarios = [
    { label: 'Aktuell', dieselPrice: currentDieselPrice },
    { label: '+0,30 €/L', dieselPrice: currentDieselPrice + 0.30 },
    { label: '+0,60 €/L (ETS2)', dieselPrice: currentDieselPrice + 0.60 },
  ]

  return scenarios.map(s => ({
    label: s.label,
    dieselPrice: s.dieselPrice,
    result: computeSurcharge(s.dieselPrice, baseDieselPrice, annualFuelCost, passthroughPct),
  }))
}
