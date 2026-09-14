import { describe, expect, it } from 'vitest'
import type { CharacterState } from '../core/model'
import {
  allocateInitialPoints,
  clampStat,
  modifyCharacterStat,
  type StatDefinition,
} from './stats'
import {
  applyTalentToCharacter,
  drawTalents,
  validateTalentSelection,
  type TalentDefinition,
} from './talents'
import { addTrait, hasTrait, removeTrait } from './traits'

function createBaseCharacter(): CharacterState {
  return {
    id: 'test-c1',
    name: '李逍遥',
    gender: 'male',
    age: 16,
    birthYear: 2000,
    currentYear: 2016,
    alive: true,
    stats: {
      physique: 10,
      intellect: 10,
      charisma: 10,
    },
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

describe('Character System - Stats & Points Allocation', () => {
  const statsDef: StatDefinition[] = [
    { id: 'physique', name: '体魄', min: 0, max: 20, initial: 5 },
    { id: 'intellect', name: '悟性', min: 0, max: 20, initial: 5 },
    { id: 'charisma', name: '魅力', min: 0, max: 20, initial: 5 },
  ]

  it('clamps stat values within defined bounds', () => {
    expect(clampStat(25, statsDef[0])).toBe(20)
    expect(clampStat(-5, statsDef[0])).toBe(0)
    expect(clampStat(12, statsDef[0])).toBe(12)
  })

  it('modifies character stat respecting boundaries', () => {
    const char = createBaseCharacter()
    const defMap = { physique: statsDef[0] }
    const updated = modifyCharacterStat(char, 'physique', 15, defMap)
    expect(updated.stats.physique).toBe(20) // capped at max 20
  })

  it('allocates initial points in average mode', () => {
    const res = allocateInitialPoints(15, statsDef, 'average')
    // 15 / 3 = 5 added to each initial (5) -> 10 each
    expect(res.allocated.physique).toBe(10)
    expect(res.allocated.intellect).toBe(10)
    expect(res.allocated.charisma).toBe(10)
    expect(res.remainingPoints).toBe(0)
  })

  it('allocates initial points in manual mode', () => {
    const res = allocateInitialPoints(10, statsDef, 'manual', {
      manualChoices: { physique: 6, intellect: 4 },
    })
    expect(res.allocated.physique).toBe(11) // 5 + 6
    expect(res.allocated.intellect).toBe(9) // 5 + 4
    expect(res.allocated.charisma).toBe(5)
    expect(res.remainingPoints).toBe(0)
  })

  it('allocates initial points in random mode deterministically with rng', () => {
    let rngCall = 0
    const mockRng = () => {
      rngCall++
      return (rngCall % 3) / 3
    }
    const res = allocateInitialPoints(10, statsDef, 'random', { rng: mockRng })
    const totalAdded =
      res.allocated.physique +
      res.allocated.intellect +
      res.allocated.charisma -
      15
    expect(totalAdded).toBe(10)
    expect(res.remainingPoints).toBe(0)
  })
})

describe('Character System - Talents', () => {
  const talentsPool: TalentDefinition[] = [
    { id: 't-smart', name: '天资聪颖', description: '悟性判定+2', rarity: 2, incompatible: ['t-fool'] },
    { id: 't-fool', name: '资质愚钝', description: '悟性判定-2', rarity: 1, incompatible: ['t-smart'] },
    { id: 't-rich', name: '家财万贯', description: '财富初始+100', rarity: 3 },
    { id: 't-lucky', name: '福星高照', description: '机缘事件翻倍', rarity: 3 },
    { id: 't-healthy', name: '百病不侵', description: '健康+20', rarity: 2 },
    { id: 't-leader', name: '领袖气质', description: '魅力+15', rarity: 2 },
    { id: 't-brave', name: '勇猛无畏', description: '体魄+10', rarity: 1 },
  ]

  it('draws non-conflicting candidate talents', () => {
    const drawn = drawTalents(talentsPool, 4, () => 0)
    expect(drawn.length).toBeLessThanOrEqual(4)
    const hasSmart = drawn.some((t) => t.id === 't-smart')
    const hasFool = drawn.some((t) => t.id === 't-fool')
    expect(hasSmart && hasFool).toBe(false)
  })

  it('validates talent selection and rejects incompatible selections', () => {
    const valid = validateTalentSelection([talentsPool[0], talentsPool[2]], 3)
    expect(valid.valid).toBe(true)

    const invalidIncompatible = validateTalentSelection(
      [talentsPool[0], talentsPool[1]],
      3,
    )
    expect(invalidIncompatible.valid).toBe(false)
    expect(invalidIncompatible.reason).toContain('互斥')

    const invalidExcess = validateTalentSelection(
      [talentsPool[0], talentsPool[2], talentsPool[3], talentsPool[4]],
      3,
    )
    expect(invalidExcess.valid).toBe(false)
  })

  it('applies talent modifiers to character', () => {
    const char = createBaseCharacter()
    const talentWithMod: TalentDefinition = {
      id: 't-super',
      name: '神力惊人',
      description: '体魄+15',
      modifiers: [{ target: 'stat', key: 'physique', value: 15 }],
    }
    const updated = applyTalentToCharacter(char, talentWithMod)
    expect(updated.talents).toContain('t-super')
    expect(updated.stats.physique).toBe(25)
  })
})

describe('Character System - Traits', () => {
  it('adds trait and handles replacements and incompatibilities', () => {
    let char = createBaseCharacter()
    char = { ...char, traits: ['trait-novice-swordsman', 'trait-fearful'] }

    const masterSwordsman = {
      id: 'trait-master-swordsman',
      name: '剑法大成',
      description: '剑道臻至化境',
      replacements: ['trait-novice-swordsman'],
      incompatible: ['trait-fearful'],
    }

    char = addTrait(char, masterSwordsman)
    expect(hasTrait(char, 'trait-master-swordsman')).toBe(true)
    expect(hasTrait(char, 'trait-novice-swordsman')).toBe(false) // replaced
    expect(hasTrait(char, 'trait-fearful')).toBe(false) // removed due to incompatible
  })

  it('removes traits properly', () => {
    let char = createBaseCharacter()
    char = { ...char, traits: ['trait-drunkard'] }
    expect(hasTrait(char, 'trait-drunkard')).toBe(true)

    char = removeTrait(char, 'trait-drunkard')
    expect(hasTrait(char, 'trait-drunkard')).toBe(false)
  })
})
