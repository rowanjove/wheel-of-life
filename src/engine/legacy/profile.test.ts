import { describe, expect, it } from 'vitest'
import {
  createEmptyLegacyProfile,
  recordCompletedLife,
  loadLegacyProfile,
  saveLegacyProfile,
} from './profile'
import type { CharacterState } from '../core/model'

function mockCharacter(overrides?: Partial<CharacterState>): CharacterState {
  return {
    id: 'char-test',
    name: '测试者',
    gender: 'female',
    age: 82,
    birthYear: 2000,
    currentYear: 2082,
    alive: false,
    stats: {
      health: 0,
      wealth: 350,
      knowledge: 85,
    },
    traits: ['trait-curious'],
    talents: [],
    originId: 'origin-academic',
    factionRelations: {},
    relationships: {},
    inventory: [{ id: 'old-book', type: 'item' }],
    milestones: [],
    flags: [],
    memories: [
      { id: 'm1', type: 'mem-1', sourceEventId: 'e1', age: 10, year: 2010, tags: [] },
      { id: 'm2', type: 'mem-2', sourceEventId: 'e2', age: 20, year: 2020, tags: [] },
      { id: 'm3', type: 'mem-3', sourceEventId: 'e3', age: 30, year: 2030, tags: [] },
    ],
    scheduledEvents: [],
    history: [
      { age: 18, year: 2018, title: '高考抉择', type: 'event' },
    ],
    ...overrides,
  }
}

describe('LegacyProfile System', () => {
  it('aggregates runs, discoveries and achievements across lives', () => {
    let profile = createEmptyLegacyProfile()
    expect(profile.runs).toBe(0)

    const ending = {
      baseEndingId: 'ending-academic-master',
      title: '博学泰斗',
      tags: ['scholar'],
      careerSummary: '',
      relationshipSummary: '',
      wealthSummary: '',
      worldSummary: '',
      epitaph: '',
      score: 320,
    }

    profile = recordCompletedLife(profile, mockCharacter(), ending)

    expect(profile.runs).toBe(1)
    expect(profile.maxLifespan).toBe(82)
    expect(profile.highestScore).toBe(320)
    expect(profile.discoveredOrigins).toContain('origin-academic')
    expect(profile.discoveredTraits).toContain('trait-curious')
    expect(profile.discoveredEndings).toContain('ending-academic-master')
    expect(profile.discoveredEvents).toContain('高考抉择')
    expect(profile.discoveredItems).toContain('old-book')

    // Achievements check
    expect(profile.achievements).toContain('ach-first-life')
    expect(profile.achievements).toContain('ach-longevity')
    expect(profile.achievements).toContain('ach-tycoon')
    expect(profile.achievements).toContain('ach-scholar')
    expect(profile.achievements).toContain('ach-butterfly-effect')
  })

  it('serializes and deserializes from storage', () => {
    const memoryStorage: Record<string, string> = {}
    const mockStorage = {
      getItem: (k: string) => memoryStorage[k] ?? null,
      setItem: (k: string, v: string) => {
        memoryStorage[k] = v
      },
    }

    let profile = createEmptyLegacyProfile()
    profile.runs = 5
    profile.highestScore = 150
    saveLegacyProfile(profile, mockStorage)

    const loaded = loadLegacyProfile(mockStorage)
    expect(loaded.runs).toBe(5)
    expect(loaded.highestScore).toBe(150)
  })
})
