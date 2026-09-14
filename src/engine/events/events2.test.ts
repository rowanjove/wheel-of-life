import { describe, expect, it } from 'vitest'
import type { CharacterState } from '../core/model'
import { evaluateCondition } from './conditions'
import { applyEffect, applyEffects } from './effects'
import { EventLibrary } from './library'
import { buildEventPool } from './pool'
import type { EventDefinition } from './schema'

function createTestChar(overrides?: Partial<CharacterState>): CharacterState {
  return {
    id: 'char-test',
    name: '沈炼',
    gender: 'male',
    age: 25,
    months: 300,
    birthYear: 1995,
    currentYear: 2020,
    alive: true,
    stats: { health: 80, wealth: 50 },
    status: { stress: 20 },
    talents: ['talent-sharp-eye'],
    traits: ['trait-swordsman'],
    factionRelations: {},
    relationships: {},
    inventory: [{ id: 'silver', name: '碎银', type: 'material', quantity: 10 }],
    milestones: [],
    flags: ['passed-exam'],
    memories: [],
    scheduledEvents: [],
    history: [{ age: 20, year: 2015, title: '初入江湖', type: 'event', metadata: { eventId: 'ev-first-step' } }],
    ...overrides,
  }
}

describe('Event System - Enhanced Condition DSL', () => {
  it('evaluates talent conditions', () => {
    const char = createTestChar()
    expect(evaluateCondition({ talent: 'talent-sharp-eye' }, { character: char })).toBe(true)
    expect(evaluateCondition({ talent: 'talent-none' }, { character: char })).toBe(false)
    expect(evaluateCondition({ talent: 'talent-none', has: false }, { character: char })).toBe(true)
  })

  it('evaluates status conditions', () => {
    const char = createTestChar()
    expect(evaluateCondition({ status: 'stress', op: '>=', value: 20 }, { character: char })).toBe(true)
    expect(evaluateCondition({ status: 'stress', op: '>', value: 50 }, { character: char })).toBe(false)
  })

  it('evaluates seenEvent conditions', () => {
    const char = createTestChar()
    expect(evaluateCondition({ seenEvent: 'ev-first-step' }, { character: char })).toBe(true)
    expect(evaluateCondition({ seenEvent: 'ev-never-seen' }, { character: char })).toBe(false)
  })
})

describe('Event System - Unified Effect Engine', () => {
  it('modifies stats and status', () => {
    const char = createTestChar()
    const res = applyEffects(char, [
      { type: 'modify_stat', key: 'wealth', value: 30 },
      { type: 'modify_status', key: 'stress', value: -10 },
    ])
    expect(res.character.stats.wealth).toBe(80)
    expect(res.character.status?.stress).toBe(10)
  })

  it('handles item additions and removals with quantity tracking', () => {
    let char = createTestChar()
    // Add existing item (silver: 10 + 5 = 15)
    char = applyEffect(char, { type: 'add_item', itemId: 'silver', quantity: 5 }).character
    const silver = char.inventory.find((i) => i.id === 'silver')
    expect(silver?.quantity).toBe(15)

    // Partially remove silver (15 - 5 = 10)
    char = applyEffect(char, { type: 'remove_item', itemId: 'silver', quantity: 5 }).character
    expect(char.inventory.find((i) => i.id === 'silver')?.quantity).toBe(10)

    // Remove all remaining silver (10 - 10 = 0 -> item removed)
    char = applyEffect(char, { type: 'remove_item', itemId: 'silver', quantity: 10 }).character
    expect(char.inventory.find((i) => i.id === 'silver')).toBeUndefined()
  })

  it('handles age advancement with months tracking', () => {
    const char = createTestChar({ age: 20, months: 240, currentYear: 2020 })
    // Advance 18 months -> age should be 21 (258 / 12 = 21.5 -> 21), year 2021
    const res = applyEffect(char, { type: 'advance_age', months: 18 })
    expect(res.character.months).toBe(258)
    expect(res.character.age).toBe(21)
    expect(res.character.currentYear).toBe(2021)
  })

  it('triggers ending effect', () => {
    const char = createTestChar()
    const res = applyEffect(char, {
      type: 'trigger_ending',
      endingId: 'ending-legendary',
      reason: '一代宗师隐退归山',
    })
    expect(res.character.alive).toBe(false)
    expect(res.character.causeOfDeath).toBe('一代宗师隐退归山')
    expect(res.endingTriggered?.endingId).toBe('ending-legendary')
  })
})

describe('Event System - Event Pool Filtering', () => {
  const events: EventDefinition[] = [
    {
      id: 'ev-once',
      title: '成人礼',
      text: '行冠礼',
      oncePerRun: true,
      probability: { mode: 'static_weight', weight: 10 },
    },
    {
      id: 'ev-bandit',
      title: '山贼劫道',
      text: '留下买路财',
      cooldown: 12, // 12 months CD
      probability: { mode: 'static_weight', weight: 10 },
    },
    {
      id: 'ev-daily',
      title: '日常漫步',
      text: '平淡一天',
      probability: { mode: 'static_weight', weight: 10 },
    },
  ]

  it('filters out oncePerRun event if already seen in history', () => {
    const library = new EventLibrary(events)
    const char = createTestChar({
      history: [
        { age: 18, year: 2013, title: '成人礼', type: 'event', metadata: { eventId: 'ev-once' } },
      ],
    })

    const pool = buildEventPool(library, { character: char })
    const ids = pool.map((e) => e.id)
    expect(ids).not.toContain('ev-once')
    expect(ids).toContain('ev-daily')
  })

  it('filters out event within cooldown window', () => {
    const library = new EventLibrary(events)
    const char = createTestChar()

    // Bandit happened at month 295, current month is 300 (diff is 5 months < 12 months CD)
    const poolCooling = buildEventPool(library, { character: char }, {
      currentMonth: 300,
      recentEvents: [{ eventId: 'ev-bandit', occurredAtMonth: 295 }],
    })
    expect(poolCooling.map((e) => e.id)).not.toContain('ev-bandit')

    // Current month is 315 (diff is 20 months >= 12 months CD)
    const poolReady = buildEventPool(library, { character: char }, {
      currentMonth: 315,
      recentEvents: [{ eventId: 'ev-bandit', occurredAtMonth: 295 }],
    })
    expect(poolReady.map((e) => e.id)).toContain('ev-bandit')
  })
})
