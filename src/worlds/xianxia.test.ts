import { describe, expect, it } from 'vitest'
import { initWorldLife, stepGenericLife } from '../engine/core/genericLifeSim'
import { validateWorldPack } from './loader'
import { xianxiaWorldPack } from './xianxia'

describe('Xianxia World Pack (修仙求道)', () => {
  it('passes complete world pack schema and structural validation', () => {
    const validation = validateWorldPack(xianxiaWorldPack)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('initializes a xianxia character with proper stats and origins', () => {
    const session = initWorldLife(xianxiaWorldPack, 12345, {
      name: '韩立',
      originId: 'origin-xianxia-village',
      chosenTalentIds: ['t-xianxia-heavenly-root'],
      allocatedStats: {
        root_bone: 20,
        comprehension: 15,
        spiritual_sense: 10,
        mindset: 10,
        fortune: 10,
      },
    })

    expect(session.pack.manifest.id).toBe('xianxia')
    expect(session.character.name).toBe('韩立')
    // origin (12) + talent (20) = 32
    expect(session.character.stats.root_bone).toBe(32)
    expect(session.character.stats.lifespan).toBe(100)
    expect(session.character.inventory.length).toBeGreaterThan(0)
  })

  it('simulates xianxia events: meditation time advancement and choices', () => {
    let session = initWorldLife(xianxiaWorldPack, 99999, {
      name: '李逍遥',
      originId: 'origin-xianxia-village',
    })

    // Advance 5 turns to test event progression
    for (let i = 0; i < 5; i++) {
      if (session.isFinished) break

      const stepRes = stepGenericLife(session)
      session = stepRes.session

      if (session.pendingEvent?.options && session.pendingEvent.options.length > 0) {
        const optId = session.pendingEvent.options[0].id
        const choiceRes = stepGenericLife(session, optId)
        session = choiceRes.session
      }
    }

    expect(session.turn).toBeGreaterThan(0)
    expect(session.character.history.length).toBeGreaterThan(1)
  })
})
