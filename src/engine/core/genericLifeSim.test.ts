import { describe, expect, it } from 'vitest'
import { modernWorldPack } from '../../worlds/modern'
import { wuxiaWorldPack } from '../../worlds/wuxia'
import { initWorldLife, resolveSessionEnding, stepGenericLife } from './genericLifeSim'

describe('Generic Life Simulation Runtime', () => {
  it('initializes and simulates a modern life through choices and instant events', () => {
    let session = initWorldLife(modernWorldPack, 12345)
    expect(session.character.age).toBe(0)
    expect(session.character.talents.length).toBeGreaterThan(0)
    expect(session.character.originId).toBeDefined()

    let steps = 0
    while (!session.isFinished && steps < 80) {
      if (session.pendingEvent && session.pendingEvent.options && session.pendingEvent.options.length > 0) {
        const pickedOption = session.pendingEvent.options[0]
        const stepRes = stepGenericLife(session, pickedOption.id)
        session = stepRes.session
      } else {
        const stepRes = stepGenericLife(session)
        session = stepRes.session
      }
      steps++
    }

    expect(steps).toBeGreaterThan(0)
    expect(session.character.history.length).toBeGreaterThan(1)
    expect(session.character.currentYear).toBeGreaterThanOrEqual(2000)
  })

  it('initializes and simulates a wuxia life on the same generic engine', () => {
    let session = initWorldLife(wuxiaWorldPack, 54321)
    expect(session.character.age).toBe(0)
    expect(session.character.talents.length).toBeGreaterThan(0)
    expect(session.character.stats.physique).toBeGreaterThanOrEqual(10)

    let steps = 0
    while (!session.isFinished && steps < 80) {
      if (session.pendingEvent && session.pendingEvent.options && session.pendingEvent.options.length > 0) {
        const pickedOption = session.pendingEvent.options[0]
        const stepRes = stepGenericLife(session, pickedOption.id)
        session = stepRes.session
      } else {
        const stepRes = stepGenericLife(session)
        session = stepRes.session
      }
      steps++
    }

    expect(steps).toBeGreaterThan(0)
    expect(session.character.history.length).toBeGreaterThan(1)
  })

  it('correctly resolves explicit and condition-based pack endings', () => {
    const session = initWorldLife(modernWorldPack, 999)
    
    // 1. 显式触发结局
    const explicitEnding = resolveSessionEnding(
      session,
      session.character,
      session.world,
      { endingId: 'ending-natural-life', reason: '寿终正寝' },
    )
    expect(explicitEnding.endingId).toBe('ending-natural-life')
    expect(explicitEnding.reason).toBe('寿终正寝')

    // 2. 财富达标触发商业传奇结局
    const richChar = {
      ...session.character,
      stats: { ...session.character.stats, wealth: 500 },
    }
    const conditionEnding = resolveSessionEnding(session, richChar, session.world)
    expect(conditionEnding.endingId).toBe('ending-wealthy-tycoon')
  })
})
