import { describe, expect, it } from 'vitest'
import type { CharacterState } from '../core/model'
import { EventLibrary } from '../events/library'
import { EventQueue } from '../events/queue'
import type { EventDefinition } from '../events/schema'
import { resolveNextFate } from './fateResolver'
import { calculateDynamicWeight } from './modifiers'
import { buildWheelSnapshot } from './wheelBuilder'

function createTestChar(overrides?: Partial<CharacterState>): CharacterState {
  return {
    id: 'test-c1',
    name: '测试员',
    gender: 'male',
    age: 20,
    birthYear: 2000,
    currentYear: 2020,
    alive: true,
    stats: { wealth: 100, physique: 10, luck: 5 },
    talents: ['talent-scholar'],
    traits: ['trait-cautious'],
    factionRelations: {},
    relationships: {},
    inventory: [{ id: 'item-sword', name: '佩剑', type: 'equipment' }],
    milestones: [],
    flags: ['met-elder'],
    memories: [],
    scheduledEvents: [],
    history: [],
    ...overrides,
  }
}

describe('Fate Engine - Dynamic Weight & Modifiers', () => {
  it('calculates dynamic weights and outputs traceable debug breakdown', () => {
    const char = createTestChar()
    const context = { character: char }

    const breakdown = calculateDynamicWeight(
      20, // baseWeight
      [
        {
          source: 'Wealth > 50',
          condition: { stat: 'wealth', op: '>', value: 50 },
          mode: 'multiply',
          value: 1.5,
        },
        {
          source: 'Has Cautious Trait',
          condition: { trait: 'trait-cautious' },
          mode: 'multiply',
          value: 0.8,
        },
        {
          source: 'Physique > 50 (Not Met)',
          condition: { stat: 'physique', op: '>', value: 50 },
          mode: 'multiply',
          value: 2.0,
        },
      ],
      context,
    )

    // 20 * 1.5 * 0.8 = 24
    expect(breakdown.baseWeight).toBe(20)
    expect(breakdown.finalWeight).toBe(24)
    expect(breakdown.entries.length).toBe(3)
    expect(breakdown.entries[0].applied).toBe(true)
    expect(breakdown.entries[1].applied).toBe(true)
    expect(breakdown.entries[2].applied).toBe(false)
  })
})

describe('Fate Engine - WheelSnapshot', () => {
  it('builds normalized wheel snapshot with proportional probabilities', () => {
    const candidates = [
      { id: 'ev-1', title: '读书', weight: 60 },
      { id: 'ev-2', title: '游历', weight: 40 },
    ]

    const snapshot = buildWheelSnapshot(candidates, () => 0.2)
    expect(snapshot.sectors.length).toBe(2)
    expect(snapshot.totalWeight).toBe(100)
    expect(snapshot.sectors[0].probability).toBe(0.6)
    expect(snapshot.sectors[0].percentage).toBe('60.0%')
    expect(snapshot.sectors[1].probability).toBe(0.4)
    expect(snapshot.sectors[1].percentage).toBe('40.0%')

    // cursor = 0.2 * 100 = 20 <= 60 -> ev-1 selected
    expect(snapshot.selectedSectorId).toBe('ev-1')
  })
})

describe('Fate Engine - FateResolver Pipeline', () => {
  const events: EventDefinition[] = [
    {
      id: 'ev-forced-duel',
      title: '比武决斗',
      text: '三年之约已至',
      probability: { mode: 'forced' },
    },
    {
      id: 'ev-meteor',
      title: '天降陨石',
      text: '天地异象',
      probability: { mode: 'fixed_chance', chance: 0.1 }, // 10%
    },
    {
      id: 'ev-study',
      title: '入馆研读',
      text: '书山有路勤为径',
      probability: {
        mode: 'dynamic_weight',
        baseWeight: 20,
        modifiers: [
          {
            source: 'Scholar talent bonus',
            condition: { talent: 'talent-scholar' },
            mode: 'multiply',
            value: 2.0,
          },
        ],
      },
    },
    {
      id: 'ev-walk',
      title: '闲庭信步',
      text: '今日天气晴朗',
      probability: { mode: 'static_weight', weight: 10 },
    },
    {
      id: 'ev-old-age-only',
      title: '垂暮感怀',
      text: '回忆一生',
      conditions: { age: { gte: 70 } },
      probability: { mode: 'static_weight', weight: 50 },
    },
  ]

  it('priority 1: triggers forced event in queue immediately', () => {
    const library = new EventLibrary(events)
    const queue = new EventQueue(['ev-forced-duel'])
    const char = createTestChar()

    const result = resolveNextFate(library, queue, char, undefined, () => 0.5)
    expect(result.type).toBe('forced')
    expect(result.selectedEvent.id).toBe('ev-forced-duel')
    expect(queue.isEmpty()).toBe(true)
  })

  it('priority 2: triggers fixed chance event when roll succeeds', () => {
    const library = new EventLibrary(events)
    const queue = new EventQueue()
    const char = createTestChar()

    // ev-meteor chance is 0.1; RNG returns 0.05 < 0.1
    const result = resolveNextFate(library, queue, char, undefined, () => 0.05)
    expect(result.type).toBe('fixed_chance')
    expect(result.selectedEvent.id).toBe('ev-meteor')
  })

  it('priority 3: filters ineligible events and spins dynamic wheel snapshot', () => {
    const library = new EventLibrary(events)
    const queue = new EventQueue()
    const char = createTestChar({ age: 20 }) // age 20 cannot trigger ev-old-age-only

    // RNG rolls 0.5 for fixed chance (0.5 >= 0.1, fails meteor), then spins wheel
    let callCount = 0
    const mockRng = () => {
      callCount++
      if (callCount === 1) return 0.5 // meteor fails
      return 0.1 // wheel spin
    }

    const result = resolveNextFate(library, queue, char, undefined, mockRng)
    expect(result.type).toBe('wheel')
    expect(result.snapshot).toBeDefined()

    // Candidates in wheel: ev-study (base 20 * 2 = 40) and ev-walk (weight 10)
    // ev-old-age-only is filtered out
    const sectorIds = result.snapshot!.sectors.map((s) => s.id)
    expect(sectorIds).toContain('ev-study')
    expect(sectorIds).toContain('ev-walk')
    expect(sectorIds).not.toContain('ev-old-age-only')

    expect(result.breakdown).toBeDefined()
  })
})
