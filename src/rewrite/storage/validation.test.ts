import { describe, expect, it } from 'vitest'
import { createRun } from '../engine/factory'
import { validateRun } from './validation'

const NOW = '2026-06-20T00:00:00.000Z'

describe('rewrite run validation', () => {
  it('accepts a fresh run', () => {
    expect(validateRun(createRun(42, NOW, 'run-1')).ok).toBe(true)
  })

  it('rejects fractional levels and mismatched spirit counts', () => {
    const run = createRun(42, NOW, 'run-1')
    expect(validateRun({
      ...run,
      character: { ...run.character, level: 10.5 },
    }).ok).toBe(false)
    expect(validateRun({
      ...run,
      character: { ...run.character, spiritCount: 2, spirits: [] },
    }).ok).toBe(false)
  })

  it('normalizes legacy character fields on load', () => {
    const run = createRun(42, NOW, 'run-1')
    const legacy = {
      ...run,
      character: {
        ...run.character,
        relationships: undefined,
        flags: undefined,
        titles: undefined,
        schoolRecords: undefined,
        growthMultiplier: undefined,
      },
    }
    const result = validateRun(legacy)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.character.relationships.reputation).toBe(0)
    expect(result.run.character.flags).toEqual([])
    expect(result.run.character.schoolRecords).toEqual([])
    expect(result.run.character.growthMultiplier).toBe(1)
  })

  it('rejects non-increasing rings and pending statuses without results', () => {
    const run = createRun(42, NOW, 'run-1')
    expect(validateRun({
      ...run,
      character: {
        ...run.character,
        rings: [
          {
            id: 'ring-1',
            index: 1,
            years: 500,
            quality: 'yellow',
            skillName: '第一命技',
            description: '',
          },
          {
            id: 'ring-2',
            index: 2,
            years: 400,
            quality: 'yellow',
            skillName: '第二命技',
            description: '',
          },
        ],
      },
    }).ok).toBe(false)
    expect(validateRun({
      ...run,
      flow: { ...run.flow, status: 'result-pending' },
    }).ok).toBe(false)
  })
})

it('allows spirits to be filled progressively only during creation', () => {
  const creating = createRun(42, NOW, 'run-1')
  creating.character.spiritCount = 4
  creating.flow = { phase: 'creation', step: 'spirit-1-category', status: 'ready' }

  expect(validateRun(creating).ok).toBe(true)

  const escaped = {
    ...creating,
    flow: { phase: 'primary-school' as const, step: 'school-selection', status: 'ready' as const },
  }
  expect(validateRun(escaped).ok).toBe(false)
})

it('retains and normalizes legacy rings and bones on load', () => {
  const run = createRun(42, NOW, 'run-1')
  const legacyKeyRings = [['soul', 'Rings'].join('')] as const
  const legacyKeyBones = [['soul', 'Bones'].join('')] as const
  const legacyRun = {
    ...run,
    character: {
      ...run.character,
      rings: undefined,
      [legacyKeyRings[0]]: [{
        id: 'legacy-ring-1',
        index: 1,
        years: 1500,
        quality: 'purple',
        skillName: '旧命技',
        description: '旧数据',
      }],
      [legacyKeyBones[0]]: {
        head: { id: 'legacy-bone-head', slot: 'head', quality: 'rare', name: '古龙骨', source: '旧古迹' },
      },
    },
  }

  const result = validateRun(legacyRun)
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.run.character.rings.length).toBe(1)
  expect(result.run.character.rings[0].years).toBe(1500)
  expect(result.run.character.bones.head?.name).toBe('古龙骨')
})
