import type { SimResult, TimelineSegment, ElectricTruckPreset } from '../types'

export interface SimParams {
  targetKm: number
  avgSpeedKmh: number
  driverMode: '1-Fahrer' | '2-Fahrer'
  startSocPct: number
  minSocPct: number
  chargeTargetSocPct?: number  // Default 90
}

// EU-VO 561/2006 — 1-Fahrer-Betrieb (vereinfacht)
const BREAK_AFTER_H   = 4.5   // nach 4,5h Lenkzeit: Pflichtpause
const BREAK_H         = 0.75  // Pause: 45 min
const MAX_DAILY_H     = 9.0   // max Tageslenkzeit
const CHART_MAX_H     = 14    // feste X-Achse für alle Charts

// ─── Ladekurve: Zeit berechnen für SOC-Delta ──────────────────────────────────

/**
 * Berechnet wie lange es dauert, von startSoc auf targetSoc zu laden,
 * und gibt dabei Teil-Segmente mit je konstanter Leistung zurück.
 * Gibt Array von {kwhAdded, durationH, powerKw} zurück.
 */
function calcChargingPhases(
  truck: ElectricTruckPreset,
  startSocPct: number,
  targetSocPct: number
): Array<{ durationH: number; powerKw: number; fromSoc: number; toSoc: number }> {
  const usable = truck.batteryUsableKwh
  const phases: Array<{ durationH: number; powerKw: number; fromSoc: number; toSoc: number }> = []

  let soc = startSocPct
  const curve = truck.chargingCurve

  for (const phase of curve) {
    if (soc >= targetSocPct) break
    if (soc >= phase.untilSocPct) continue  // already past this phase

    const phaseEnd = Math.min(targetSocPct, phase.untilSocPct)
    const kwhNeeded = ((phaseEnd - soc) / 100) * usable
    const durationH = kwhNeeded / phase.powerKw

    phases.push({ durationH, powerKw: phase.powerKw, fromSoc: soc, toSoc: phaseEnd })
    soc = phaseEnd
  }

  // Falls targetSoc über letzter Kurvenphase liegt (sollte nicht vorkommen)
  if (soc < targetSocPct) {
    const lastPower = curve[curve.length - 1]?.powerKw ?? truck.maxChargingKw
    const kwhNeeded = ((targetSocPct - soc) / 100) * usable
    phases.push({ durationH: kwhNeeded / lastPower, powerKw: lastPower, fromSoc: soc, toSoc: targetSocPct })
  }

  return phases
}


/**
 * Welchen SOC erreiche ich wenn ich maxDurationH lade (ab startSoc)?
 * Gibt {endSoc, phases} zurück.
 */
function chargeForDuration(
  truck: ElectricTruckPreset,
  startSocPct: number,
  maxTargetSocPct: number,
  maxDurationH: number
): { endSoc: number; phases: Array<{ durationH: number; powerKw: number; fromSoc: number; toSoc: number }> } {
  const usable = truck.batteryUsableKwh
  const phases: Array<{ durationH: number; powerKw: number; fromSoc: number; toSoc: number }> = []
  let soc = startSocPct
  let remaining = maxDurationH

  for (const phase of truck.chargingCurve) {
    if (soc >= maxTargetSocPct || remaining <= 0) break
    if (soc >= phase.untilSocPct) continue

    const phaseEnd = Math.min(maxTargetSocPct, phase.untilSocPct)
    const kwhNeeded = ((phaseEnd - soc) / 100) * usable
    const fullPhaseDuration = kwhNeeded / phase.powerKw

    const actualDuration = Math.min(fullPhaseDuration, remaining)
    const kwhAdded = actualDuration * phase.powerKw
    const socAdded = (kwhAdded / usable) * 100
    const toSoc = Math.min(phaseEnd, soc + socAdded)

    phases.push({ durationH: actualDuration, powerKw: phase.powerKw, fromSoc: soc, toSoc })
    soc = toSoc
    remaining -= actualDuration
  }

  return { endSoc: soc, phases }
}

// ─── Hauptsimulation ──────────────────────────────────────────────────────────

export function simulateTour(truck: ElectricTruckPreset, params: SimParams): SimResult {
  const {
    targetKm,
    avgSpeedKmh,
    startSocPct,
    minSocPct,
    chargeTargetSocPct = 90,
  } = params

  const kwhPerKm = truck.consumptionPer100km / 100
  const usable = truck.batteryUsableKwh

  const segments: TimelineSegment[] = []

  let t = 0           // aktuelle Zeit (h)
  let km = 0          // gefahrene km
  let soc = startSocPct
  let drivingH = 0    // Lenkzeit seit letzter Pause
  let dailyH = 0      // Tageslenkzeit gesamt

  let extraStops = 0
  let extraMinutes = 0

  function rangeKm() {
    return Math.max(0, ((soc - minSocPct) / 100) * usable / kwhPerKm)
  }

  function addDrivingSegment(driveH: number) {
    const kmThis = Math.min(driveH * avgSpeedKmh, targetKm - km)
    const kwhUsed = kmThis * kwhPerKm
    const socDrop = (kwhUsed / usable) * 100
    const startSocSeg = soc

    soc = Math.max(minSocPct, soc - socDrop)
    const actualH = kmThis / avgSpeedKmh

    segments.push({
      startH: t, endH: t + actualH,
      type: 'driving',
      startSoc: startSocSeg, endSoc: soc,
      startKm: km, endKm: km + kmThis,
    })

    t += actualH
    km += kmThis
    drivingH += actualH
    dailyH += actualH
  }

  function addMandatoryBreak() {
    // Laden während Pflichtpause — so viel wie in 45 min geht
    const { endSoc, phases } = chargeForDuration(truck, soc, chargeTargetSocPct, BREAK_H)

    let cursor = t
    // Lade-Phasen mit unterschiedlichen Steigungen
    for (const ph of phases) {
      if (ph.durationH < 0.001) continue
      segments.push({
        startH: cursor, endH: cursor + ph.durationH,
        type: 'charging',
        startSoc: ph.fromSoc, endSoc: ph.toSoc,
        startKm: km, endKm: km,
      })
      cursor += ph.durationH
    }

    // Rest der Pause (Fahrer rastet, kein Laden nötig oder fertig)
    const pauseEnd = t + BREAK_H
    if (cursor < pauseEnd - 0.001) {
      segments.push({
        startH: cursor, endH: pauseEnd,
        type: 'break_idle',
        startSoc: endSoc, endSoc: endSoc,
        startKm: km, endKm: km,
      })
    }

    soc = endSoc
    t = pauseEnd
    drivingH = 0
  }

  function addExtraStop(_reason: 'battery') {
    // Notfall-Ladestopp außerhalb Pflichtpause: lade auf chargeTarget
    const { endSoc, phases } = { endSoc: chargeTargetSocPct, phases: calcChargingPhases(truck, soc, chargeTargetSocPct) }
    const totalH = phases.reduce((s, p) => s + p.durationH, 0)

    let cursor = t
    for (const ph of phases) {
      if (ph.durationH < 0.001) continue
      segments.push({
        startH: cursor, endH: cursor + ph.durationH,
        type: 'extra_stop',
        startSoc: ph.fromSoc, endSoc: ph.toSoc,
        startKm: km, endKm: km,
      })
      cursor += ph.durationH
    }

    extraStops++
    extraMinutes += Math.round(totalH * 60)
    soc = endSoc
    t = cursor
    drivingH = 0  // gilt als neue Lenkphase nach Stopp
  }

  // ─── Hauptschleife ──────────────────────────────────────────────────────────
  let safety = 0
  while (km < targetKm - 0.5 && t < CHART_MAX_H + 2 && safety < 200) {
    safety++

    // Batterie leer → Notfall-Ladestopp
    if (soc <= minSocPct + 0.5) {
      addExtraStop('battery')
      continue
    }

    const timeUntilBreak = Math.max(0, BREAK_AFTER_H - drivingH)
    const timeUntilDailyMax = Math.max(0, MAX_DAILY_H - dailyH)
    const timeUntilDest = (targetKm - km) / avgSpeedKmh
    const timeUntilBattery = rangeKm() / avgSpeedKmh

    // Lookahead: wenn Batterie-Ende < 15 min vor Pflichtpause → zur Pause durchfahren
    const LOOKAHEAD_H = 0.25
    const effectiveBattery =
      timeUntilBreak > 0 &&
      timeUntilBattery < timeUntilBreak &&
      timeUntilBreak - timeUntilBattery < LOOKAHEAD_H
        ? timeUntilBreak
        : timeUntilBattery

    const driveH = Math.min(timeUntilBreak, timeUntilDailyMax, timeUntilDest, effectiveBattery)

    if (driveH < 0.001) {
      // Grenzfall: kein Fahren möglich — direkt zur Pause oder Ladestopp
      if (timeUntilBreak < 0.001 && dailyH < MAX_DAILY_H - 0.01) {
        addMandatoryBreak()
      } else {
        break // Tageslimit erreicht oder keine Energie
      }
      continue
    }

    addDrivingSegment(driveH)

    if (km >= targetKm - 0.5) break

    // Was hat das Fahren beendet?
    const mandatoryBreakDue = Math.abs(drivingH - BREAK_AFTER_H) < 0.01
    const dailyMaxDue = Math.abs(dailyH - MAX_DAILY_H) < 0.01

    if (mandatoryBreakDue || dailyMaxDue) {
      addMandatoryBreak()
    }
    // Sonst: Batterie-Limit → nächste Iteration löst Notfall-Ladestopp aus
  }

  const feasible = km >= targetKm - 1

  let statusLabel: SimResult['statusLabel']
  if (!feasible) statusLabel = 'not-feasible'
  else if (extraStops > 0) statusLabel = 'extra-stop'
  else statusLabel = 'ok'

  return {
    vehicleId: truck.id,
    vehicleName: truck.name,
    feasible,
    totalTimeH: t,
    extraChargingStops: extraStops,
    extraChargingMinutes: extraMinutes,
    segments,
    statusLabel,
  }
}

export function simulateAllTrucks(trucks: ElectricTruckPreset[], params: SimParams): SimResult[] {
  return trucks.map(t => simulateTour(t, params))
}

// ─── Dichte Zeitreihendaten für Chart ────────────────────────────────────────

export const CHART_MAX_HOURS = CHART_MAX_H

/**
 * Erzeugt dichte Datenpunkte alle 6 min (0.1h) für ein linear skaliertes Chart.
 * Jedes Intervall interpoliert SOC linear innerhalb seines Segments.
 */
export function generateChartData(
  segments: TimelineSegment[],
  maxH: number = CHART_MAX_H
): Array<{ timeH: number; socPct: number | null }> {
  const STEP = 0.1
  const points: Array<{ timeH: number; socPct: number | null }> = []

  const lastSeg = segments[segments.length - 1]
  const tourEndH = lastSeg ? lastSeg.endH : 0

  for (let i = 0; i <= Math.round(maxH / STEP); i++) {
    const t = Math.round(i * STEP * 100) / 100

    // Nach Tourende: keine Linie mehr
    if (t > tourEndH + 0.001) {
      points.push({ timeH: t, socPct: null })
      continue
    }

    // Segment finden das diesen Zeitpunkt enthält
    const seg = segments.find(s => t >= s.startH - 0.001 && t <= s.endH + 0.001)

    if (!seg) {
      // Zwischen Segmenten (Rundungslücken) → letzten bekannten Wert fortführen
      const prev = [...segments].reverse().find(s => s.endH <= t + 0.001)
      points.push({ timeH: t, socPct: prev ? prev.endSoc : null })
      continue
    }

    const span = seg.endH - seg.startH
    const soc = span < 0.001
      ? seg.startSoc
      : seg.startSoc + (seg.endSoc - seg.startSoc) * ((t - seg.startH) / span)

    points.push({ timeH: t, socPct: Math.round(Math.max(0, Math.min(100, soc)) * 10) / 10 })
  }

  return points
}
