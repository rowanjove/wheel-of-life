import { describe, expect, it } from 'vitest'
import { EventLibrary } from '../engine/events/library'
import { EventQueue } from '../engine/events/queue'
import { resolveNextFate } from '../engine/fate/fateResolver'
import { validateWorldPack, worldRegistry } from './loader'
import { modernWorldPack } from './modern'
import { wuxiaWorldPack } from './wuxia'
import type { CharacterState } from '../engine/core/model'

function createEmptyCharacter(id: string, name: string): CharacterState {
  return {
    id,
    name,
    gender: 'male',
    age: 18,
    birthYear: 2000,
    currentYear: 2018,
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
  }
}

describe('World Pack Validation & Registration', () => {
  it('validates and registers Modern World Pack without errors', () => {
    const res = validateWorldPack(modernWorldPack)
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)

    worldRegistry.register(modernWorldPack)
    expect(worldRegistry.get('modern')).toBeDefined()
  })

  it('validates and registers Wuxia World Pack without errors', () => {
    const res = validateWorldPack(wuxiaWorldPack)
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)

    worldRegistry.register(wuxiaWorldPack)
    expect(worldRegistry.get('wuxia')).toBeDefined()
  })
})

describe('Zero Engine Changes Cross-World Verification', () => {
  it('runs modern life events on generic FateResolver', () => {
    const library = new EventLibrary(modernWorldPack.events)
    const queue = new EventQueue()
    const char = createEmptyCharacter('modern-char', '张明')
    char.stats = { health: 80, knowledge: 50, wealth: 20, charisma: 50 }

    const fate = resolveNextFate(library, queue, char, undefined, () => 0.3)
    expect(fate.selectedEvent).toBeDefined()
    expect(fate.eligiblePoolSize).toBeGreaterThan(0)
    if (fate.type === 'wheel') {
      expect(fate.snapshot).toBeDefined()
      expect(fate.snapshot!.sectors.length).toBeGreaterThan(0)
    }
  })

  it('runs wuxia life events on generic FateResolver with zero engine modification', () => {
    const library = new EventLibrary(wuxiaWorldPack.events)
    const queue = new EventQueue()
    const char = createEmptyCharacter('wuxia-char', '令狐冲')
    char.stats = { physique: 35, intellect: 25, mentality: 20, luck: 15, health: 80, reputation: 35 }
    char.inventory = [{ id: 'item-healing-pill', name: '九转金疮药', type: 'consumable', quantity: 1 }]

    const fate = resolveNextFate(library, queue, char, undefined, () => 0.4)
    expect(fate.selectedEvent).toBeDefined()
    expect(fate.eligiblePoolSize).toBeGreaterThan(0)
    if (fate.type === 'wheel') {
      expect(fate.snapshot).toBeDefined()
      expect(fate.snapshot!.sectors.length).toBeGreaterThan(0)
    }
  })
})
