import { describe, expect, it } from 'vitest'
import {
  rewriteEndings,
  rewriteEvents,
  rewriteSchools,
  rewriteSpirits,
} from '../content/adapters'
import { BASE_RING_WEIGHTS } from './rings'

describe('rewrite content coverage', () => {
  it('keeps the complete unique content catalog', () => {
    expect(rewriteSpirits).toHaveLength(90)
    expect(rewriteSchools.primary).toHaveLength(16)
    expect(rewriteSchools.middle).toHaveLength(16)
    expect(rewriteSchools.high).toHaveLength(16)
    expect(rewriteEvents).toHaveLength(136)
    expect(rewriteEndings).toHaveLength(12)

    const ids = [
      ...rewriteSpirits,
      ...rewriteSchools.primary,
      ...rewriteSchools.middle,
      ...rewriteSchools.high,
      ...rewriteEvents,
      ...rewriteEndings,
    ].map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a rewrite consumer for every adapted event effect', () => {
    const effectTypes = new Set<string>()
    const visit = (effects: typeof rewriteEvents[number]['effects']) => {
      for (const effect of effects) {
        effectTypes.add(effect.type)
        if (effect.type === 'composite') visit(effect.effects)
      }
    }
    rewriteEvents.forEach((event) => {
      visit(event.effects)
      event.choices.forEach((choice) => visit(choice.effects))
    })
    const consumedTypes = new Set([
      'composite',
      'flag',
      'growth-multiplier',
      'hero-unlock',
      'item',
      'knowledge',
      'level',
      'max-level',
      'partner',
      'queue-activity',
      'relationship',
      'title',
    ])
    expect([...effectTypes].every((type) => consumedTypes.has(type))).toBe(true)
    expect(effectTypes.size).toBeGreaterThan(0)
  })

  it('keeps every ring base probability row at 100 percent', () => {
    Object.values(BASE_RING_WEIGHTS).forEach((weights) => {
      expect(Object.values(weights).reduce((sum, weight) => sum + weight, 0))
        .toBeCloseTo(100, 8)
    })
  })
})
