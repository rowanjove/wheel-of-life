import type { RewriteCharacter } from '../../rewrite/engine/model'
import type { CharacterState, InventoryItem, MilestoneState } from './model'

export function legacyToGeneric(legacy: RewriteCharacter): CharacterState {
  const age = Math.max(0, legacy.currentYear - legacy.birthYear)

  const stats: Record<string, number> = {
    level: legacy.level,
    power: legacy.level,
    looks: legacy.looks,
    innatePower: legacy.innatePower,
    growthMultiplier: legacy.growthMultiplier,
  }

  const traits = legacy.talentId ? [legacy.talentId] : []

  const factionRelations: Record<string, number> = {
    sanctuary: legacy.relationships.sanctuary,
    empire: legacy.relationships.empire,
    beasts: legacy.relationships.beasts,
  }

  const relationships: Record<string, number> = {
    reputation: legacy.relationships.reputation,
  }

  const inventory: InventoryItem[] = legacy.items.map((itemId) => ({
    id: itemId,
    name: itemId,
    type: 'item',
    quantity: 1,
  }))

  const milestones: MilestoneState[] = legacy.titles.map((title) => ({
    id: title,
    name: title,
    achievedAtYear: legacy.currentYear,
    achievedAtAge: age,
  }))

  return {
    id: `${legacy.name}-${legacy.birthYear}`,
    name: legacy.name,
    gender: legacy.gender,
    age,
    birthYear: legacy.birthYear,
    currentYear: legacy.currentYear,
    alive: legacy.endingId === null,
    stats,
    talents: legacy.talentId ? [legacy.talentId] : [],
    traits,
    factionRelations,
    relationships,
    inventory,
    milestones,
    flags: [...legacy.flags],
    memories: [],
    scheduledEvents: [],
    history: [],
  }
}

export function genericToLegacy(
  generic: CharacterState,
  fallback?: Partial<RewriteCharacter>,
): RewriteCharacter {
  const level = generic.stats.power ?? generic.stats.level ?? 1
  const looks = generic.stats.looks ?? 50
  const innatePower = generic.stats.innatePower ?? 10
  const growthMultiplier = generic.stats.growthMultiplier ?? 1

  const emptyBones = {
    head: null,
    torso: null,
    'left-arm': null,
    'right-arm': null,
    'left-leg': null,
    'right-leg': null,
    wing: null,
  }

  return {
    name: generic.name,
    gender: generic.gender === 'other' ? null : generic.gender,
    race: fallback?.race ?? 'human',
    raceName: fallback?.raceName ?? '人类',
    birthYear: generic.birthYear,
    currentYear: generic.currentYear,
    level,
    maxLevel: fallback?.maxLevel ?? 100,
    spiritCount: fallback?.spiritCount ?? 0,
    spirits: fallback?.spirits ?? [],
    rings: fallback?.rings ?? [],
    bones: fallback?.bones ?? emptyBones,
    flags: [...generic.flags],
    looks,
    birthPlace: fallback?.birthPlace ?? '初生之地',
    innatePower,
    talentId: generic.traits[0] ?? null,
    endingId: generic.alive ? null : (fallback?.endingId ?? 'default-ending'),
    schoolRecords: fallback?.schoolRecords ?? [],
    titles: generic.milestones.map((m) => m.name),
    items: generic.inventory.map((i) => i.id),
    knowledge: fallback?.knowledge ?? [],
    relationships: {
      sanctuary: generic.factionRelations.sanctuary ?? 0,
      empire: generic.factionRelations.empire ?? 0,
      beasts: generic.factionRelations.beasts ?? 0,
      reputation: generic.relationships.reputation ?? 0,
    },
    partner: fallback?.partner ?? null,
    growthMultiplier,
    lastHeroInteractionYear: fallback?.lastHeroInteractionYear ?? null,
    heroWins: fallback?.heroWins ?? 0,
    heroLosses: fallback?.heroLosses ?? 0,
    heroDraws: fallback?.heroDraws ?? 0,
    contestAppearances: fallback?.contestAppearances ?? 0,
    contestBestRank: fallback?.contestBestRank ?? null,
  }
}
