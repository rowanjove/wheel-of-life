import { describe, expect, it } from 'vitest'
import type { CharacterState, WorldState } from '../core/model'
import { evaluateCondition, type Condition } from './conditions'
import { addMemory, getMemories, hasMemory } from './memory'
import { popDueEvents, scheduleEvent } from './scheduler'

function createTestCharacter(overrides?: Partial<CharacterState>): CharacterState {
  return {
    id: 'test-char',
    name: '测试者',
    gender: 'male',
    age: 18,
    birthYear: 2000,
    currentYear: 2018,
    alive: true,
    stats: {
      health: 80,
      knowledge: 65,
      wealth: 20,
    },
    traits: ['curious', 'persistent'],
    talents: [],
    factionRelations: {
      academy: 50,
      guild: -10,
    },
    relationships: {
      parent: 70,
    },
    inventory: [
      { id: 'book', name: '旧书', type: 'item', quantity: 2 },
    ],
    milestones: [],
    flags: ['high-school-graduated'],
    memories: [],
    scheduledEvents: [],
    history: [],
    ...overrides,
  }
}

describe('Universal Condition DSL', () => {
  it('evaluates atomic stat comparisons', () => {
    const character = createTestCharacter()
    expect(evaluateCondition({ stat: 'knowledge', op: '>=', value: 60 }, { character })).toBe(true)
    expect(evaluateCondition({ stat: 'knowledge', op: '>', value: 70 }, { character })).toBe(false)
    expect(evaluateCondition({ stat: 'wealth', op: '<=', value: 20 }, { character })).toBe(true)
  })

  it('evaluates age condition with operators or ranges', () => {
    const character = createTestCharacter({ age: 22 })
    expect(evaluateCondition({ age: { gte: 18, lte: 25 } }, { character })).toBe(true)
    expect(evaluateCondition({ age: { op: '>=', value: 30 } }, { character })).toBe(false)
  })

  it('evaluates traits, flags and inventory', () => {
    const character = createTestCharacter()
    expect(evaluateCondition({ trait: 'curious' }, { character })).toBe(true)
    expect(evaluateCondition({ trait: 'coward', has: false }, { character })).toBe(true)
    expect(evaluateCondition({ flag: 'high-school-graduated' }, { character })).toBe(true)
    expect(evaluateCondition({ item: 'book', quantity: 2 }, { character })).toBe(true)
    expect(evaluateCondition({ item: 'sword' }, { character })).toBe(false)
  })

  it('evaluates composite logical conditions (all, any, not)', () => {
    const character = createTestCharacter()
    const complexCondition: Condition = {
      all: [
        { stat: 'health', op: '>=', value: 70 },
        {
          any: [
            { trait: 'curious' },
            { trait: 'genius' },
          ],
        },
        {
          not: { flag: 'injured' },
        },
      ],
    }
    expect(evaluateCondition(complexCondition, { character })).toBe(true)
  })

  it('evaluates world state conditions', () => {
    const character = createTestCharacter()
    const world: WorldState = {
      year: 2018,
      variables: {
        economy: 85,
        inWar: false,
      },
      factions: {},
      activeEvents: ['tech-boom'],
      history: [],
    }

    expect(evaluateCondition({ worldVariable: 'economy', op: '>', value: 70 }, { character, world })).toBe(true)
    expect(evaluateCondition({ worldEvent: 'tech-boom' }, { character, world })).toBe(true)
    expect(evaluateCondition({ worldEvent: 'pandemic' }, { character, world })).toBe(false)
  })
})

describe('Memory System', () => {
  it('adds and queries memories for causality reflection', () => {
    let char = createTestCharacter()
    expect(hasMemory(char, 'saved-stranger')).toBe(false)

    char = addMemory(char, 'saved-stranger', 'event-street-help', ['kindness', 'secret'])
    expect(hasMemory(char, 'saved-stranger')).toBe(true)
    expect(hasMemory(char, 'kindness')).toBe(true)

    const memories = getMemories(char, 'saved-stranger')
    expect(memories).toHaveLength(1)
    expect(memories[0].year).toBe(2018)
    expect(memories[0].age).toBe(18)

    // Condition DSL can check memory
    expect(evaluateCondition({ memory: 'saved-stranger' }, { character: char })).toBe(true)
  })
})

describe('Scheduled Events Engine', () => {
  it('schedules delayed consequences and pops them when due', () => {
    let char = createTestCharacter({ age: 20, currentYear: 2020 })
    // Schedule a startup outcome 5 years later
    char = scheduleEvent(char, 'startup-outcome', 5, {
      conditions: { stat: 'knowledge', op: '>=', value: 50 },
    })

    expect(char.scheduledEvents).toHaveLength(1)
    expect(char.scheduledEvents[0].triggerYear).toBe(2025)
    expect(char.scheduledEvents[0].triggerAge).toBe(25)

    // 2 years later (2022) -> not due
    const checkMid = popDueEvents({ ...char, currentYear: 2022, age: 22 })
    expect(checkMid.dueEvents).toHaveLength(0)
    expect(checkMid.remainingEvents).toHaveLength(1)

    // 5 years later (2025) -> due!
    const checkDue = popDueEvents({ ...char, currentYear: 2025, age: 25 })
    expect(checkDue.dueEvents).toHaveLength(1)
    expect(checkDue.dueEvents[0].eventId).toBe('startup-outcome')
    expect(checkDue.character.scheduledEvents).toHaveLength(0)
  })
})
