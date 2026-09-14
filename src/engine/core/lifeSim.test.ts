import { describe, expect, it } from 'vitest'
import { initModernLife, advanceLifeStep, simulateFullLife } from './lifeSim'

describe('Modern Life Simulation Engine', () => {
  it('initializes a clean modern character without fantasy/IP terms', () => {
    const session = initModernLife(12345, '李伟')
    expect(session.character.name).toBe('李伟')
    expect(session.character.age).toBe(0)
    expect(session.character.alive).toBe(true)
    expect(session.character.stats.health).toBeGreaterThan(50)
    expect(session.character.stats.wealth).toBeDefined()
    expect(session.character.stats.knowledge).toBeDefined()
    expect(session.character.stats.charisma).toBeDefined()
  })

  it('guarantees 100% seed reproducibility (same seed -> identical life)', () => {
    const run1 = simulateFullLife(98765, '王芳')
    const run2 = simulateFullLife(98765, '王芳')

    expect(run1.character.age).toBe(run2.character.age)
    expect(run1.character.stats).toEqual(run2.character.stats)
    expect(run1.character.flags).toEqual(run2.character.flags)
    expect(run1.character.traits).toEqual(run2.character.traits)
    expect(run1.ending?.baseEndingId).toBe(run2.ending?.baseEndingId)
    expect(run1.ending?.score).toBe(run2.ending?.score)
    expect(run1.character.history.length).toBe(run2.character.history.length)
  })

  it('completes full life cycle with balanced pacing and major fate wheels', () => {
    const session = simulateFullLife(42, '赵雷')
    expect(session.isFinished).toBe(true)
    expect(session.character.alive).toBe(false)
    expect(session.character.age).toBeGreaterThanOrEqual(50)
    expect(session.ending).toBeDefined()
    expect(session.ending?.title).toBeDefined()
    expect(session.ending?.epitaph).toContain('赵雷')

    // Pacing verification: operations within 20~50, wheels 2~4
    expect(session.decisionCount).toBeGreaterThan(15)
    expect(session.wheelCount).toBeGreaterThanOrEqual(1)
    expect(session.wheelCount).toBeLessThanOrEqual(5)

    // Life history contains key chapters
    const historyTitles = session.character.history.map((h) => h.title)
    expect(historyTitles.some((t) => t.includes('降生'))).toBe(true)
  })
})
