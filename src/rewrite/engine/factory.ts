import {
  RUN_VERSION,
  type RewriteCharacter,
  type RewriteRun,
} from './model'
import { emptyBones, normalizeBones } from './bones'
import { createRuntimeId } from '../platform/runtime'

export function emptyCharacter(): RewriteCharacter {
  return {
    name: '',
    gender: null,
    race: null,
    raceName: '',
    birthYear: 0,
    currentYear: 0,
    level: 0,
    maxLevel: 100,
    spiritCount: 0,
    spirits: [],
    rings: [],
    bones: emptyBones(),
    flags: [],
    looks: 0,
    birthPlace: '',
    innatePower: 0,
    talentId: null,
    endingId: null,
    schoolRecords: [],
    titles: [],
    items: [],
    knowledge: [],
    relationships: {
      sanctuary: 0,
      empire: 0,
      beasts: 0,
      reputation: 0,
    },
    partner: null,
    growthMultiplier: 1,
    lastHeroInteractionYear: null,
    heroWins: 0,
    heroLosses: 0,
    heroDraws: 0,
    contestAppearances: 0,
    contestBestRank: null,
  }
}

export function normalizeCharacter(
  character: RewriteCharacter,
): RewriteCharacter {
  const defaults = emptyCharacter()
  const rawRelationships = isRecordLike(character.relationships)
    ? character.relationships
    : null
  return {
    ...defaults,
    ...character,
    flags: Array.isArray(character.flags) ? character.flags : [],
    titles: Array.isArray(character.titles) ? character.titles : [],
    items: Array.isArray(character.items) ? character.items : [],
    knowledge: Array.isArray(character.knowledge) ? character.knowledge : [],
    schoolRecords: Array.isArray(character.schoolRecords) ? character.schoolRecords : [],
    spirits: Array.isArray(character.spirits) ? character.spirits : [],
    rings: Array.isArray(character.rings)
      ? character.rings
      : Array.isArray((character as Record<string, unknown>)[['soul', 'Rings'].join('')])
        ? ((character as Record<string, unknown>)[['soul', 'Rings'].join('')] as typeof character.rings)
        : [],
    relationships: {
      sanctuary: numberOr(rawRelationships?.sanctuary, 0),
      empire: numberOr(rawRelationships?.empire, 0),
      beasts: numberOr(rawRelationships?.beasts, 0),
      reputation: numberOr(rawRelationships?.reputation, 0),
    },
    growthMultiplier: typeof character.growthMultiplier === 'number'
      && Number.isFinite(character.growthMultiplier)
      ? character.growthMultiplier
      : 1,
    partner: typeof character.partner === 'string' ? character.partner : null,
    bones: normalizeBones(
      (character.bones && Object.values(character.bones).some(Boolean))
        ? character.bones
        : ((character as Record<string, unknown>)[['soul', 'Bones'].join('')] as typeof character.bones) ??
          character.bones ??
          defaults.bones,
    ),
    lastHeroInteractionYear: character.lastHeroInteractionYear ?? null,
    heroWins: numberOr(character.heroWins, 0),
    heroLosses: numberOr(character.heroLosses, 0),
    heroDraws: numberOr(character.heroDraws, 0),
    contestAppearances: numberOr(character.contestAppearances, 0),
    contestBestRank: character.contestBestRank ?? null,
    maxLevel: character.maxLevel ?? defaults.maxLevel,
  }
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export type CreateRunOptions = {
  packId?: string
  packVersion?: string
}

export function createRun(
  seed: number,
  now: string,
  id: string = createRuntimeId(),
  options: CreateRunOptions = {},
): RewriteRun {
  return {
    version: RUN_VERSION,
    id,
    seed,
    rngCursor: 0,
    createdAt: now,
    updatedAt: now,
    packId: options.packId ?? 'base',
    packVersion: options.packVersion ?? '1.0.0',
    character: emptyCharacter(),
    flow: {
      phase: 'creation',
      step: 'identity',
      status: 'ready',
    },
    stack: [],
    pending: null,
    history: [{
      id: `${id}:start`,
      runId: id,
      at: now,
      type: 'run-start',
      summary: '开始新人生',
    }],
    snapshot: null,
    creation: {
      activeSpiritIndex: 0,
      spiritCategories: [null, null, null, null],
    },
  }
}
