import { describe, expect, it } from 'vitest'
import { genericToLegacy, legacyToGeneric } from './adapter'
import type { RewriteCharacter } from '../../rewrite/engine/model'

describe('Generic Core Adapter', () => {
  const sampleLegacy: RewriteCharacter = {
    name: '林风',
    gender: 'male',
    race: 'human',
    raceName: '人类',
    birthYear: 10,
    currentYear: 28,
    level: 45,
    maxLevel: 100,
    spiritCount: 1,
    spirits: [],
    rings: [],
    bones: {
      head: null,
      torso: null,
      'left-arm': null,
      'right-arm': null,
      'left-leg': null,
      'right-leg': null,
      wing: null,
    },
    flags: ['enrolled', 'won-tourney'],
    looks: 85,
    birthPlace: '诺丁',
    innatePower: 9,
    talentId: 'natural-fighter',
    endingId: null,
    schoolRecords: [],
    titles: ['初级赛优胜'],
    items: ['medallion'],
    knowledge: ['tactics'],
    relationships: {
      sanctuary: 10,
      empire: 25,
      beasts: -5,
      reputation: 30,
    },
    partner: null,
    growthMultiplier: 1.2,
    lastHeroInteractionYear: 25,
    heroWins: 1,
    heroLosses: 0,
    heroDraws: 1,
    contestAppearances: 2,
    contestBestRank: 'top4',
  }

  it('converts legacy character to generic state with dynamic stats and factions', () => {
    const generic = legacyToGeneric(sampleLegacy)
    expect(generic.name).toBe('林风')
    expect(generic.age).toBe(18)
    expect(generic.stats.level).toBe(45)
    expect(generic.stats.looks).toBe(85)
    expect(generic.traits).toContain('natural-fighter')
    expect(generic.factionRelations.empire).toBe(25)
    expect(generic.relationships.reputation).toBe(30)
    expect(generic.inventory.map((i) => i.id)).toContain('medallion')
    expect(generic.milestones.map((m) => m.name)).toContain('初级赛优胜')
  })

  it('round-trips generic character back to legacy model', () => {
    const generic = legacyToGeneric(sampleLegacy)
    const backToLegacy = genericToLegacy(generic, sampleLegacy)
    expect(backToLegacy.name).toBe(sampleLegacy.name)
    expect(backToLegacy.level).toBe(sampleLegacy.level)
    expect(backToLegacy.talentId).toBe(sampleLegacy.talentId)
    expect(backToLegacy.flags).toEqual(sampleLegacy.flags)
    expect(backToLegacy.relationships).toEqual(sampleLegacy.relationships)
  })
})
