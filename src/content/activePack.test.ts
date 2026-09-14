import { describe, expect, it, beforeEach } from 'vitest'
import { applyContentPack, resetToBasePack } from './registry'
import { getCreationContent, getNarrativeContent } from './activePack'
import { buildBasePack } from '../rewrite/content/adapters'
import { creationWheelOptions } from '../rewrite/engine/creation'
import { createRun } from '../rewrite/engine/factory'
import { heroOpportunityOptions, heroCombatPower } from '../rewrite/engine/heroInteraction'

beforeEach(() => {
  resetToBasePack()
})

describe('pack-driven creation & narrative', () => {
  it('reads creation options from active pack', () => {
    const run = createRun(1, '2026-01-01T00:00:00.000Z', 'r1')
    const looks = creationWheelOptions({
      ...run,
      flow: { phase: 'creation', step: 'looks', status: 'ready' },
    })
    expect(looks).toHaveLength(10)
    expect(getCreationContent().timelines.length).toBeGreaterThan(0)
  })

  it('overrides creation when pack applied', () => {
    const base = buildBasePack()
    applyContentPack({
      ...base,
      id: 'custom',
      name: '自定义',
      creation: {
        ...base.creation!,
        timelines: [{ id: 'only', name: '唯一时代', weight: 1, year: 99 }],
      },
    }, { persist: false })

    const run = createRun(1, '2026-01-01T00:00:00.000Z', 'r2')
    const options = creationWheelOptions({
      ...run,
      flow: { phase: 'creation', step: 'timeline', status: 'ready' },
    })
    expect(options).toHaveLength(1)
    expect(options[0].name).toBe('唯一时代')
  })

  it('uses narrative power bands and opportunities', () => {
    expect(heroCombatPower(10)).toBe(200)
    expect(heroCombatPower(40)).toBe(8000)
    expect(heroOpportunityOptions().length).toBe(
      getNarrativeContent().hero.opportunities.length,
    )
  })
})
