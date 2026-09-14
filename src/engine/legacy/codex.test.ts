import { beforeEach, describe, expect, it } from 'vitest'
import { modernWorldPack } from '../../worlds/modern'
import type { CharacterState } from '../core/model'
import {
  createEmptyCodex,
  getCodexProgress,
  loadCodex,
  recordSessionToCodex,
  saveCodex,
} from './codex'

function createChar(): CharacterState {
  return {
    id: 'char-codex-test',
    name: '李云',
    gender: 'female',
    age: 35,
    birthYear: 2000,
    currentYear: 2035,
    alive: false,
    causeOfDeath: '操劳过度暴毙',
    stats: {},
    talents: ['t-mod-smart'],
    traits: ['tr-mod-burnout'],
    factionRelations: {},
    relationships: {},
    inventory: [{ id: 'item-coffee', name: '特浓咖啡', type: 'consumable', quantity: 3 }],
    milestones: [],
    flags: [],
    memories: [],
    scheduledEvents: [],
    history: [
      {
        age: 18,
        year: 2018,
        title: '参加高考',
        type: 'event',
        metadata: { eventId: 'ev-college-entrance' },
      },
    ],
  }
}

describe('Life Codex & Death Compendium', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('records session discoveries and updates death compendium', () => {
    const codex = createEmptyCodex()
    const char = createChar()

    const { codex: updated, newDiscoveriesCount } = recordSessionToCodex(
      codex,
      char,
      modernWorldPack,
      {
        endingId: 'ending-workaholic-burnout',
        title: '职场燃尽',
        reason: '操劳过度暴毙',
      },
    )

    expect(newDiscoveriesCount).toBeGreaterThan(0)
    expect(updated.totalRuns).toBe(1)
    expect(updated.totalYearsSimulated).toBe(35)
    expect(updated.maxLifespan).toBe(35)

    // Check unlocked components
    expect(updated.unlockedTalents['t-mod-smart']).toBeDefined()
    expect(updated.unlockedTraits['tr-mod-burnout']).toBeDefined()
    expect(updated.unlockedItems['item-coffee']).toBeDefined()
    expect(updated.unlockedEvents['ev-college-entrance']).toBeDefined()
    expect(updated.unlockedEndings['ending-workaholic-burnout']).toBeDefined()

    // Check death compendium
    expect(updated.deathCompendium.length).toBe(1)
    expect(updated.deathCompendium[0].cause).toBe('操劳过度暴毙')
    expect(updated.deathCompendium[0].characterName).toBe('李云')
  })

  it('calculates pack progress accurately against total definitions', () => {
    const codex = createEmptyCodex()
    const char = createChar()

    const { codex: updated } = recordSessionToCodex(codex, char, modernWorldPack)
    const progress = getCodexProgress(updated, modernWorldPack)

    expect(progress.talents.unlocked).toBe(1)
    expect(progress.talents.total).toBe(modernWorldPack.talents.length)
    expect(progress.traits.unlocked).toBe(1)
    expect(progress.totalUnlocked).toBeGreaterThan(0)
    expect(parseFloat(progress.percentage ?? '0')).toBeGreaterThan(0)
  })

  it('persists and reloads from localStorage gracefully', () => {
    const codex = createEmptyCodex()
    codex.totalRuns = 42
    saveCodex(codex)

    const reloaded = loadCodex()
    expect(reloaded.totalRuns).toBe(42)
  })
})
