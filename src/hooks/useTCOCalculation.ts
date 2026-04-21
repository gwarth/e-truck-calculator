import { useMemo } from 'react'
import type { TCOInputs, TCOResults } from '../types'
import { computeTCO } from '../utils/tcoFormulas'

export function useTCOCalculation(inputs: TCOInputs): TCOResults {
  return useMemo(() => computeTCO(inputs), [inputs])
}
