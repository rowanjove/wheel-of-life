import type { CharacterState } from '../core/model'
import type { EndingResult } from '../ending/endingResolver'

export interface RareRecord {
  id: string
  title: string
  achievedAt: string
  value: number | string
}

export interface LegacyProfile {
  version: 1
  runs: number
  totalYearsSimulated: number
  maxLifespan: number
  highestScore: number
  discoveredEvents: string[]
  discoveredTraits: string[]
  discoveredOrigins: string[]
  discoveredEndings: string[]
  discoveredItems: string[]
  achievements: string[]
  rareRecords: RareRecord[]
}

const STORAGE_KEY = 'wol_legacy_profile_v1'

export function createEmptyLegacyProfile(): LegacyProfile {
  return {
    version: 1,
    runs: 0,
    totalYearsSimulated: 0,
    maxLifespan: 0,
    highestScore: 0,
    discoveredEvents: [],
    discoveredTraits: [],
    discoveredOrigins: [],
    discoveredEndings: [],
    discoveredItems: [],
    achievements: [],
    rareRecords: [],
  }
}

export function loadLegacyProfile(storage: Pick<Storage, 'getItem'> = globalThis.localStorage): LegacyProfile {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return createEmptyLegacyProfile()
    const parsed = JSON.parse(raw)
    return {
      ...createEmptyLegacyProfile(),
      ...parsed,
    }
  } catch {
    return createEmptyLegacyProfile()
  }
}

export function saveLegacyProfile(
  profile: LegacyProfile,
  storage: Pick<Storage, 'setItem'> = globalThis.localStorage,
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Graceful fallback if storage is unavailable (e.g. headless/ssr)
  }
}

export function recordCompletedLife(
  currentProfile: LegacyProfile,
  character: CharacterState,
  ending?: EndingResult,
): LegacyProfile {
  const runs = currentProfile.runs + 1
  const totalYearsSimulated = currentProfile.totalYearsSimulated + character.age
  const maxLifespan = Math.max(currentProfile.maxLifespan, character.age)
  const score = ending?.score ?? 0
  const highestScore = Math.max(currentProfile.highestScore, score)

  // Aggregate discoveries
  const discoveredEvents = [
    ...new Set([
      ...currentProfile.discoveredEvents,
      ...character.history.filter((h) => h.type === 'event').map((h) => h.title),
    ]),
  ]

  const discoveredTraits = [
    ...new Set([
      ...currentProfile.discoveredTraits,
      ...character.traits,
    ]),
  ]

  const discoveredOrigins = [
    ...new Set([
      ...currentProfile.discoveredOrigins,
      ...(character.originId ? [character.originId] : []),
    ]),
  ]

  const discoveredEndings = [
    ...new Set([
      ...currentProfile.discoveredEndings,
      ...(ending ? [ending.baseEndingId] : []),
    ]),
  ]

  const discoveredItems = [
    ...new Set([
      ...currentProfile.discoveredItems,
      ...character.inventory.map((i) => i.id),
    ]),
  ]

  // Evaluate dynamic achievements
  const achievements = new Set(currentProfile.achievements)
  if (runs >= 1) achievements.add('ach-first-life')
  if (runs >= 10) achievements.add('ach-veteran-soul')
  if (character.age >= 80) achievements.add('ach-longevity')
  if ((character.stats.wealth ?? 0) >= 300) achievements.add('ach-tycoon')
  if ((character.stats.knowledge ?? 0) >= 80) achievements.add('ach-scholar')
  if (character.memories.length >= 3) achievements.add('ach-butterfly-effect')

  return {
    ...currentProfile,
    runs,
    totalYearsSimulated,
    maxLifespan,
    highestScore,
    discoveredEvents,
    discoveredTraits,
    discoveredOrigins,
    discoveredEndings,
    discoveredItems,
    achievements: Array.from(achievements),
  }
}
