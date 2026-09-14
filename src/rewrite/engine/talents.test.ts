import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import {
  applyTalentAcquisition,
  growthAmount,
  talentRingModifiers,
} from './talents'
import { applyLevelChange } from './progression'
import { buildLegalRingBins } from './rings'

describe('talent runtime', () => {
  it('applies rapid cultivation and resilient body bonuses', () => {
    const base = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1').character
    const rapid = applyTalentAcquisition(base, 'rapid-cultivation')
    expect(rapid.growthMultiplier).toBeCloseTo(1.2)

    const resilient = applyTalentAcquisition(base, 'resilient-body')
    const injured = applyLevelChange({ ...resilient, level: 30 }, -10)
    expect(injured.level).toBe(25)
  })

  it('shifts ring quality odds for ring affinity', () => {
    const bins = buildLegalRingBins(5, 0, talentRingModifiers('ring-affinity'))
    const purple = bins
      .filter((bin) => bin.quality === 'purple')
      .reduce((sum, bin) => sum + bin.weight, 0)
    const baseline = buildLegalRingBins(5, 0, {})
      .filter((bin) => bin.quality === 'purple')
      .reduce((sum, bin) => sum + bin.weight, 0)
    expect(purple).toBeGreaterThan(baseline)
  })

  it('boosts growth for divine speed growth talent', () => {
    const character = applyTalentAcquisition(
      createRun(42, '2026-06-20T00:00:00.000Z', 'run-1').character,
      'divine-speed-growth',
    )
    expect(growthAmount(character, 4)).toBeGreaterThan(4)
  })
})