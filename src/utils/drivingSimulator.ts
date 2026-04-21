import type { SimResult, ChargingStop, MandatoryBreak, SocDataPoint } from '../types'
import type { ElectricTruckPreset } from '../types'

interface SimParams {
  targetKm: number
  avgSpeedKmh: number
  driverMode: '1-Fahrer' | '2-Fahrer'
  startSocPct: number
  minSocPct: number        // Sicherheitspuffer, z.B. 15%
  chargeTargetSocPct: number  // Ziel-SOC nach Laden, z.B. 90%
}

/**
 * Simuliert eine Tour nach EU-VO 561/2006.
 *
 * 1-Fahrer:
 *   - Max. 4,5h Lenkzeit → 45 min Pflichtpause
 *   - Max. 9h Lenkzeit/Tag
 *   - Tagesruhezeit: 11h
 *
 * 2-Fahrer (Doppelbesatzung):
 *   - Pause kann im Fahrzeug abgeleistet werden
 *   - Keine langen Stopps → Laden muss aktiv geplant werden
 *   - Max. ~10h Lenkzeit pro Fahrer, aber Team kann länger fahren
 */
export function simulateTour(truck: ElectricTruckPreset, params: SimParams): SimResult {
  const {
    targetKm,
    avgSpeedKmh,
    driverMode,
    startSocPct,
    minSocPct,
    chargeTargetSocPct = 90,
  } = params

  const kwhPerKm = truck.consumptionPer100km / 100
  const usableKwh = truck.batteryUsableKwh
  const maxChargingKw = truck.maxChargingKw

  let timeH = 0
  let kmDriven = 0
  let socPct = startSocPct
  let drivingTimeH = 0        // kumulierte Lenkzeit seit letzter Pause
  let dailyDrivingH = 0       // Lenkzeit heute

  const chargingStops: ChargingStop[] = []
  const mandatoryBreaks: MandatoryBreak[] = []
  const socProfile: SocDataPoint[] = [{ timeH: 0, socPct, kmDriven: 0, phase: 'driving' }]

  let extraChargingStops = 0
  let extraChargingMinutes = 0

  // Hilfsfunktionen
  const socKwh = () => (socPct / 100) * usableKwh
  const kmRemaining = () => kmDriven >= targetKm ? 0 : targetKm - kmDriven
  const rangeAtCurrentSoc = () => (socPct - minSocPct) / 100 * usableKwh / kwhPerKm

  // Hauptschleife
  let iterations = 0
  while (kmDriven < targetKm && iterations < 500) {
    iterations++

    // Wie weit kann ich mit aktuellem SOC (bis min-Puffer)?
    const rangeNow = rangeAtCurrentSoc()

    if (rangeNow <= 0) {
      // SOC zu niedrig, Notfall-Laden
      const chargeToKwh = (chargeTargetSocPct / 100) * usableKwh
      const chargeNeededKwh = Math.max(0, chargeToKwh - socKwh())
      const chargeDurationH = chargeNeededKwh / maxChargingKw
      const chargeDurationMin = chargeDurationH * 60

      const stop: ChargingStop = {
        timeH,
        kmAtStop: kmDriven,
        durationMin: Math.ceil(chargeDurationMin),
        socBefore: socPct,
        socAfter: chargeTargetSocPct,
        isMandatoryBreak: false,
      }
      chargingStops.push(stop)
      extraChargingStops++
      extraChargingMinutes += stop.durationMin

      timeH += chargeDurationH
      socPct = chargeTargetSocPct
      drivingTimeH = 0

      socProfile.push({ timeH, socPct, kmDriven, phase: 'charging' })
      continue
    }

    // Fahren bis: Pflichtpause, Ziel erreicht, oder Batterie leer
    let driveSegmentH: number
    let triggerReason: 'break' | 'destination' | 'battery'

    if (driverMode === '1-Fahrer') {
      const timeUntilBreak = Math.max(0, 4.5 - drivingTimeH)
      const timeUntilDestination = (kmRemaining()) / avgSpeedKmh
      const timeUntilBatteryMin = rangeNow / avgSpeedKmh

      // Lookahead: wenn Batterie-Minimum weniger als 15 min vor der Pflichtpause liegt,
      // einfach bis zur Pause weiterfahren (realer Fahrer stoppt nicht 8 km vor dem Rastplatz)
      const LOOKAHEAD_H = 0.25 // 15 Minuten
      const effectiveBatteryLimit =
        timeUntilBreak > 0 && timeUntilBatteryMin < timeUntilBreak &&
        timeUntilBreak - timeUntilBatteryMin < LOOKAHEAD_H
          ? timeUntilBreak  // zur Pause durchfahren
          : timeUntilBatteryMin

      driveSegmentH = Math.min(timeUntilBreak, timeUntilDestination, effectiveBatteryLimit)

      if (driveSegmentH <= 0.001) {
        if (timeUntilDestination <= 0.001) {
          triggerReason = 'destination'
        } else if (effectiveBatteryLimit <= 0.001) {
          triggerReason = 'battery'
        } else {
          triggerReason = 'break'
        }
      } else if (driveSegmentH >= timeUntilDestination - 0.001) {
        triggerReason = 'destination'
      } else if (driveSegmentH >= timeUntilBreak - 0.001 && timeUntilBreak <= effectiveBatteryLimit) {
        triggerReason = 'break'
      } else if (driveSegmentH >= effectiveBatteryLimit - 0.001) {
        triggerReason = 'battery'
      } else {
        triggerReason = 'break'
      }
    } else {
      // 2-Fahrer: kein festes 4,5h-Limit, aber Ladestopp muss aktiv geplant werden
      // Fahren bis Batterie-Minimum oder Ziel
      const timeUntilDestination = kmRemaining() / avgSpeedKmh
      const timeUntilBatteryMin = rangeNow / avgSpeedKmh

      driveSegmentH = Math.min(timeUntilDestination, timeUntilBatteryMin)
      triggerReason = driveSegmentH >= timeUntilDestination - 0.001 ? 'destination' : 'battery'
    }

    // Fahrt durchführen
    const kmThisSegment = Math.min(driveSegmentH * avgSpeedKmh, kmRemaining())
    const kwhUsed = kmThisSegment * kwhPerKm
    const socUsedPct = (kwhUsed / usableKwh) * 100

    kmDriven += kmThisSegment
    timeH += kmThisSegment / avgSpeedKmh
    drivingTimeH += kmThisSegment / avgSpeedKmh
    dailyDrivingH += kmThisSegment / avgSpeedKmh
    socPct = Math.max(minSocPct, socPct - socUsedPct)

    socProfile.push({ timeH, socPct, kmDriven, phase: 'driving' })

    if (triggerReason === 'destination') break

    if (triggerReason === 'break' && driverMode === '1-Fahrer') {
      // Pflichtpause (45 min)
      const pauseDurationMin = 45
      const pauseDurationH = pauseDurationMin / 60

      const mb: MandatoryBreak = { timeH, durationMin: pauseDurationMin, type: '45min' }
      mandatoryBreaks.push(mb)

      // Kann ich während der Pflichtpause laden?
      const chargeToKwh = (chargeTargetSocPct / 100) * usableKwh
      const chargeNeededKwh = Math.max(0, chargeToKwh - socKwh())
      const chargeTimeH = chargeNeededKwh / maxChargingKw
      const chargeTimeMin = chargeTimeH * 60

      if (chargeNeededKwh > 0 && chargeTimeMin > 0) {
        // Laden während Pause
        if (chargeTimeMin <= pauseDurationMin) {
          // Laden passt in die Pause → kein Extra-Zeitverlust
          const stop: ChargingStop = {
            timeH,
            kmAtStop: kmDriven,
            durationMin: Math.ceil(chargeTimeMin),
            socBefore: socPct,
            socAfter: chargeTargetSocPct,
            isMandatoryBreak: true,
          }
          chargingStops.push(stop)
          socPct = chargeTargetSocPct
          socProfile.push({ timeH: timeH + chargeTimeH, socPct, kmDriven, phase: 'charging' })
        } else {
          // Laden dauert länger als Pause → Extrazeit nötig
          const extraMin = Math.ceil(chargeTimeMin - pauseDurationMin)
          const stop: ChargingStop = {
            timeH,
            kmAtStop: kmDriven,
            durationMin: Math.ceil(chargeTimeMin),
            socBefore: socPct,
            socAfter: chargeTargetSocPct,
            isMandatoryBreak: true,
          }
          chargingStops.push(stop)
          extraChargingStops++
          extraChargingMinutes += extraMin
          socPct = chargeTargetSocPct
          socProfile.push({ timeH: timeH + chargeTimeH, socPct, kmDriven, phase: 'charging' })
          timeH += chargeTimeH - pauseDurationH
        }
      }

      timeH += pauseDurationH
      drivingTimeH = 0
      socProfile.push({ timeH, socPct, kmDriven, phase: 'break' })
    }

    if (triggerReason === 'battery') {
      // Ladestopp außerhalb Pflichtpause
      const chargeToKwh = (chargeTargetSocPct / 100) * usableKwh
      const chargeNeededKwh = Math.max(0, chargeToKwh - socKwh())
      const chargeDurationH = chargeNeededKwh / maxChargingKw
      const chargeDurationMin = chargeDurationH * 60

      const stop: ChargingStop = {
        timeH,
        kmAtStop: kmDriven,
        durationMin: Math.ceil(chargeDurationMin),
        socBefore: socPct,
        socAfter: chargeTargetSocPct,
        isMandatoryBreak: false,
      }
      chargingStops.push(stop)
      extraChargingStops++
      extraChargingMinutes += stop.durationMin

      timeH += chargeDurationH
      socPct = chargeTargetSocPct
      drivingTimeH = 0

      socProfile.push({ timeH, socPct, kmDriven, phase: 'charging' })
    }
  }

  const feasible = kmDriven >= targetKm - 1

  let statusLabel: SimResult['statusLabel']
  if (!feasible) {
    statusLabel = 'not-feasible'
  } else if (extraChargingStops > 0) {
    statusLabel = 'extra-stop'
  } else {
    statusLabel = 'ok'
  }

  return {
    vehicleId: truck.id,
    vehicleName: truck.name,
    feasible,
    totalTimeH: timeH,
    totalDrivingH: targetKm / avgSpeedKmh,
    extraChargingStops,
    extraChargingMinutes,
    chargingStops,
    mandatoryBreaks,
    socProfile,
    statusLabel,
  }
}

export function simulateAllTrucks(
  trucks: ElectricTruckPreset[],
  params: SimParams
): SimResult[] {
  return trucks.map(t => simulateTour(t, params))
}
