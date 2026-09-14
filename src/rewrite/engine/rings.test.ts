import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import type { RingState } from './model'
import {
  BASE_RING_WEIGHTS,
  buildLegalRingBins,
  classifyRingYears,
  missingRingIndexes,
  queueMissingRingActivities,
  rollYearsWithinBin,
  totalWeightByQuality,
} from './rings'
import { createSeededRng } from './rng'

describe('strict ring rules', () => {
  it.each([
    [10, 'white'], [99, 'white'],
    [100, 'yellow'], [999, 'yellow'],
    [1_000, 'purple'], [9_999, 'purple'],
    [10_000, 'black'], [99_999, 'black'],
    [100_000, 'red'], [999_999, 'red'],
    [1_000_000, 'gold-white'],
  ] as const)('classifies %i years as %s', (years, quality) => {
    expect(classifyRingYears(years)).toBe(quality)
  })

  it('clips or removes bins that cannot exceed the previous ring', () => {
    const bins = buildLegalRingBins(6, 8_000, {})

    expect(bins.some((bin) => bin.min === 8_001 && bin.max === 8_999)).toBe(true)
    expect(bins.every((bin) => bin.max > 8_000)).toBe(true)
    expect(bins.some((bin) => bin.quality === 'white')).toBe(false)
    expect(bins.some((bin) => bin.quality === 'yellow')).toBe(false)
  })

  it('makes black more likely than purple for the sixth ring', () => {
    const totals = totalWeightByQuality(buildLegalRingBins(6, 0, {}))
    expect(totals.black).toBeGreaterThan(totals.purple)
  })

  it('keeps every base weight row normalized to 100 percent', () => {
    for (const weights of Object.values(BASE_RING_WEIGHTS)) {
      expect(Object.values(weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100)
    }
  })

  it('queues every missing ring threshold in order', () => {
    const rings: RingState[] = [{
      id: 'ring-1',
      index: 1,
      years: 90,
      quality: 'white',
      skillName: '第一命技',
      description: '',
    }]
    expect(missingRingIndexes(36, [])).toEqual([1, 2, 3])
    expect(missingRingIndexes(36, rings)).toEqual([2, 3])
  })

  it('rolls an integer year inside the selected legal bin', () => {
    const bin = buildLegalRingBins(3, 0, {}).find((candidate) => candidate.quality === 'purple')!
    const years = rollYearsWithinBin(bin, createSeededRng(42, 0))
    expect(Number.isInteger(years)).toBe(true)
    expect(years).toBeGreaterThanOrEqual(bin.min)
    expect(years).toBeLessThanOrEqual(bin.max)
  })

  it('can build a sixth-ring wheel for an existing character', () => {
    const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
    expect(buildLegalRingBins(6, 9_999, {}).some((bin) => bin.quality === 'black')).toBe(true)
    expect(run.character.rings).toEqual([])
  })

  it('returns directly to the requested flow when no ring is missing', () => {
    const base = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
    const run = {
      ...base,
      flow: { phase: 'primary-school' as const, step: 'year-2', status: 'result-pending' as const },
      pending: null,
    }
    const next = queueMissingRingActivities(
      run,
      { phase: 'primary-school', step: 'year-3', status: 'ready' },
    )

    expect(next.flow).toEqual({
      phase: 'primary-school',
      step: 'year-3',
      status: 'ready',
    })
  })
})
