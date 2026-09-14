import { describe, expect, it } from 'vitest'
import type { CharacterState, ItemDefinition } from '../core/model'
import { EventLibrary } from '../events/library'
import { EventQueue } from '../events/queue'
import type { EventDefinition } from '../events/schema'
import {
  collectExternalModifiers,
  inspectCandidatePool,
  resolveNextFate,
} from './fateResolver'
import {
  createStreakTracker,
  getPityModifiers,
  updateStreakTracker,
} from './pity'

function createChar(overrides?: Partial<CharacterState>): CharacterState {
  return {
    id: 'char-test',
    name: '测试员',
    gender: 'male',
    age: 20,
    birthYear: 2000,
    currentYear: 2020,
    alive: true,
    stats: {},
    talents: [],
    traits: [],
    factionRelations: {},
    relationships: {},
    inventory: [],
    milestones: [],
    flags: [],
    memories: [],
    scheduledEvents: [],
    history: [],
    ...overrides,
  }
}

describe('Pity & Anti-Streak System', () => {
  it('tracks opportunity drought and gives escalating pity multipliers after 6 turns', () => {
    let tracker = createStreakTracker()
    expect(tracker.opportunityDroughtTurns).toBe(0)

    // 5 turns without opportunity
    for (let i = 0; i < 5; i++) {
      tracker = updateStreakTracker(tracker, 'daily')
    }
    expect(tracker.opportunityDroughtTurns).toBe(5)
    let pity = getPityModifiers(tracker)
    expect(pity.opportunityMultiplier).toBe(1.0)
    expect(pity.modifiers.length).toBe(0)

    // Turn 6 without opportunity
    tracker = updateStreakTracker(tracker, 'daily')
    expect(tracker.opportunityDroughtTurns).toBe(6)
    pity = getPityModifiers(tracker)
    // extra = (6 - 5) * 0.25 = 0.25 -> 1.25x
    expect(pity.opportunityMultiplier).toBe(1.25)
    expect(pity.modifiers.length).toBe(1)
    expect(pity.modifiers[0].source).toContain('连续 6 轮未出现')

    // Turn 8 without opportunity
    tracker = updateStreakTracker(tracker, 'daily')
    tracker = updateStreakTracker(tracker, 'daily')
    expect(tracker.opportunityDroughtTurns).toBe(8)
    pity = getPityModifiers(tracker)
    // extra = (8 - 5) * 0.25 = 0.75 -> 1.75x
    expect(pity.opportunityMultiplier).toBe(1.75)

    // Encountering opportunity resets drought
    tracker = updateStreakTracker(tracker, 'opportunity')
    expect(tracker.opportunityDroughtTurns).toBe(0)
    pity = getPityModifiers(tracker)
    expect(pity.opportunityMultiplier).toBe(1.0)
  })

  it('protects against consecutive crisis events for 2 turns', () => {
    let tracker = createStreakTracker()
    expect(tracker.recentCrisisTurns).toBe(999)

    // Encounter a crisis event
    tracker = updateStreakTracker(tracker, 'crisis')
    expect(tracker.recentCrisisTurns).toBe(0)
    let pity = getPityModifiers(tracker)
    expect(pity.crisisMultiplier).toBe(0.4)

    // 1 turn later
    tracker = updateStreakTracker(tracker, 'daily')
    expect(tracker.recentCrisisTurns).toBe(1)
    pity = getPityModifiers(tracker)
    expect(pity.crisisMultiplier).toBe(0.4)

    // 3 turns later
    tracker = updateStreakTracker(tracker, 'daily')
    tracker = updateStreakTracker(tracker, 'daily')
    expect(tracker.recentCrisisTurns).toBe(3)
    pity = getPityModifiers(tracker)
    expect(pity.crisisMultiplier).toBe(1.0)
  })

  it('radiates item weight modifiers onto matching events in candidate pool', () => {
    const itemDefs: ItemDefinition[] = [
      {
        id: 'item-map',
        name: '残破古图',
        description: '记载着上古遗迹',
        type: 'key',
        eventWeightModifiers: [
          { tag: 'ruins', multiplier: 2.5 },
          { category: 'opportunity', multiplier: 1.5 },
        ],
      },
    ]

    const char = createChar({
      inventory: [{ id: 'item-map', name: '残破古图', type: 'key', quantity: 1 }],
    })

    const testEvent: EventDefinition = {
      id: 'ev-ruins-explore',
      title: '探寻秘境',
      text: '根据古图指引...',
      category: 'opportunity',
      tags: ['ruins'],
      probability: { mode: 'static_weight', weight: 10 },
    }

    const tracker = createStreakTracker()
    const mods = collectExternalModifiers(testEvent, char, {
      streakTracker: tracker,
      itemDefinitions: itemDefs,
    })

    // Should match both tag:ruins and category:opportunity
    expect(mods.length).toBe(2)
    expect(mods[0].value).toBe(2.5)
    expect(mods[1].value).toBe(1.5)
  })

  it('inspectCandidatePool computes candidate weights and breakdowns accurately', () => {
    const events: EventDefinition[] = [
      {
        id: 'ev-1',
        title: '偶遇世外高人',
        text: '机缘...',
        category: 'opportunity',
        probability: { mode: 'static_weight', weight: 20 },
      },
      {
        id: 'ev-2',
        title: '日常漫步',
        text: '平常的一天',
        category: 'daily',
        probability: { mode: 'static_weight', weight: 80 },
      },
    ]

    const lib = new EventLibrary(events)
    const queue = new EventQueue()
    const char = createChar()

    // Setup tracker with 7 drought turns -> 1.5x multiplier for opportunity
    const tracker = { opportunityDroughtTurns: 7, recentCrisisTurns: 10 }

    const result = inspectCandidatePool(lib, queue, char, undefined, {
      streakTracker: tracker,
    })

    expect(result.candidates.length).toBe(2)
    const ev1 = result.candidates.find((c) => c.id === 'ev-1')
    expect(ev1).toBeDefined()
    // 20 * 1.5 = 30
    expect(ev1?.weight).toBe(30)
    expect(result.totalWeight).toBe(110) // 30 + 80
    expect(result.breakdowns['ev-1'].entries.length).toBe(1)
    expect(result.breakdowns['ev-1'].entries[0].applied).toBe(true)
    expect(result.pityStatus?.opportunityMultiplier).toBe(1.5)
  })
})
