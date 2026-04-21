import { useMemo } from 'react'
import type { TCOInputs, SimResult } from '../types'
import { ELECTRIC_PRESETS } from '../data/presets'
import { simulateAllTrucks } from '../utils/drivingSimulator'

export function useDrivingSimulation(inputs: TCOInputs): SimResult[] {
  return useMemo(() => {
    return simulateAllTrucks(ELECTRIC_PRESETS, {
      targetKm: inputs.simTargetKm,
      avgSpeedKmh: inputs.simAvgSpeedKmh,
      driverMode: inputs.simDriverMode,
      startSocPct: inputs.simStartSocPct,
      minSocPct: inputs.simMinSocPct,
      chargeTargetSocPct: 90,
    })
  }, [
    inputs.simTargetKm,
    inputs.simAvgSpeedKmh,
    inputs.simDriverMode,
    inputs.simStartSocPct,
    inputs.simMinSocPct,
  ])
}
