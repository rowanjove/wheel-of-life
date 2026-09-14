import type { CharacterState } from '../core/model'
import type { WorldPack } from '../../worlds/packTypes'

export interface CodexDiscoveryRecord {
  id: string
  name: string
  worldId?: string
  unlockedAt: number // timestamp
  count: number // 次数
}

export interface DeathRecord {
  cause: string
  worldId?: string
  age: number
  characterName: string
  unlockedAt: number
}

export interface LifeCodex {
  version: 1
  totalRuns: number
  totalYearsSimulated: number
  maxLifespan: number
  unlockedEvents: Record<string, CodexDiscoveryRecord>
  unlockedTalents: Record<string, CodexDiscoveryRecord>
  unlockedTraits: Record<string, CodexDiscoveryRecord>
  unlockedItems: Record<string, CodexDiscoveryRecord>
  unlockedEndings: Record<string, CodexDiscoveryRecord>
  deathCompendium: DeathRecord[]
}

export const CODEX_STORAGE_KEY = 'wol_codex_v1'

export function createEmptyCodex(): LifeCodex {
  return {
    version: 1,
    totalRuns: 0,
    totalYearsSimulated: 0,
    maxLifespan: 0,
    unlockedEvents: {},
    unlockedTalents: {},
    unlockedTraits: {},
    unlockedItems: {},
    unlockedEndings: {},
    deathCompendium: [],
  }
}

export function loadCodex(storage: Pick<Storage, 'getItem'> = globalThis.localStorage): LifeCodex {
  try {
    const raw = storage?.getItem(CODEX_STORAGE_KEY)
    if (!raw) return createEmptyCodex()
    const parsed = JSON.parse(raw)
    return {
      ...createEmptyCodex(),
      ...parsed,
    }
  } catch {
    return createEmptyCodex()
  }
}

export function saveCodex(
  codex: LifeCodex,
  storage: Pick<Storage, 'setItem'> = globalThis.localStorage,
): void {
  try {
    storage?.setItem(CODEX_STORAGE_KEY, JSON.stringify(codex))
  } catch {
    // Graceful fallback
  }
}

/**
 * 将一局结束或推进中的人生沉淀记录至跨局图鉴中
 */
export function recordSessionToCodex(
  currentCodex: LifeCodex,
  character: CharacterState,
  pack: WorldPack,
  ending?: { endingId: string; title: string; reason?: string },
): { codex: LifeCodex; newDiscoveriesCount: number } {
  const now = Date.now()
  let newDiscoveriesCount = 0

  const codex: LifeCodex = {
    ...currentCodex,
    totalRuns: currentCodex.totalRuns + 1,
    totalYearsSimulated: currentCodex.totalYearsSimulated + character.age,
    maxLifespan: Math.max(currentCodex.maxLifespan, character.age),
    unlockedEvents: { ...currentCodex.unlockedEvents },
    unlockedTalents: { ...currentCodex.unlockedTalents },
    unlockedTraits: { ...currentCodex.unlockedTraits },
    unlockedItems: { ...currentCodex.unlockedItems },
    unlockedEndings: { ...currentCodex.unlockedEndings },
    deathCompendium: [...currentCodex.deathCompendium],
  }

  // 1. 记录天赋
  for (const talentId of character.talents) {
    const tDef = pack.talents.find((t) => t.id === talentId)
    const name = tDef?.name ?? talentId
    if (!codex.unlockedTalents[talentId]) {
      newDiscoveriesCount++
      codex.unlockedTalents[talentId] = { id: talentId, name, worldId: pack.manifest.id, unlockedAt: now, count: 1 }
    } else {
      codex.unlockedTalents[talentId].count += 1
    }
  }

  // 2. 记录特质
  for (const traitId of character.traits) {
    const trDef = pack.traits.find((t) => t.id === traitId)
    const name = trDef?.name ?? traitId
    if (!codex.unlockedTraits[traitId]) {
      newDiscoveriesCount++
      codex.unlockedTraits[traitId] = { id: traitId, name, worldId: pack.manifest.id, unlockedAt: now, count: 1 }
    } else {
      codex.unlockedTraits[traitId].count += 1
    }
  }

  // 3. 记录物品
  for (const item of character.inventory) {
    const iDef = pack.items.find((i) => i.id === item.id)
    const name = item.name ?? iDef?.name ?? item.id
    if (!codex.unlockedItems[item.id]) {
      newDiscoveriesCount++
      codex.unlockedItems[item.id] = { id: item.id, name, worldId: pack.manifest.id, unlockedAt: now, count: 1 }
    } else {
      codex.unlockedItems[item.id].count += (item.quantity ?? 1)
    }
  }

  // 4. 记录历史事件
  for (const record of character.history) {
    const eventId = (record.metadata?.eventId as string) ?? record.title
    if (eventId) {
      if (!codex.unlockedEvents[eventId]) {
        newDiscoveriesCount++
        codex.unlockedEvents[eventId] = { id: eventId, name: record.title, worldId: pack.manifest.id, unlockedAt: now, count: 1 }
      } else {
        codex.unlockedEvents[eventId].count += 1
      }
    }
  }

  // 5. 记录终局
  if (ending) {
    if (!codex.unlockedEndings[ending.endingId]) {
      newDiscoveriesCount++
      codex.unlockedEndings[ending.endingId] = {
        id: ending.endingId,
        name: ending.title,
        worldId: pack.manifest.id,
        unlockedAt: now,
        count: 1,
      }
    } else {
      codex.unlockedEndings[ending.endingId].count += 1
    }
  }

  // 6. 记录死法（若角色非存活且有死因）
  if (!character.alive && (character.causeOfDeath || ending?.reason)) {
    const cause = character.causeOfDeath ?? ending?.reason ?? '生命消逝'
    const isAlreadyRecorded = codex.deathCompendium.some(
      (d) => d.cause === cause && d.worldId === pack.manifest.id,
    )
    if (!isAlreadyRecorded) {
      newDiscoveriesCount++
    }
    codex.deathCompendium.push({
      cause,
      worldId: pack.manifest.id,
      age: character.age,
      characterName: character.name,
      unlockedAt: now,
    })
  }

  saveCodex(codex)
  return { codex, newDiscoveriesCount }
}

/**
 * 计算世界图鉴探索收集度进度
 */
export function getCodexProgress(codex: LifeCodex, pack?: WorldPack) {
  if (!pack) {
    const eventsCount = Object.keys(codex.unlockedEvents).length
    const talentsCount = Object.keys(codex.unlockedTalents).length
    const traitsCount = Object.keys(codex.unlockedTraits).length
    const itemsCount = Object.keys(codex.unlockedItems).length
    const endingsCount = Object.keys(codex.unlockedEndings).length
    const deathsCount = codex.deathCompendium.length

    return {
      events: { unlocked: eventsCount },
      talents: { unlocked: talentsCount },
      traits: { unlocked: traitsCount },
      items: { unlocked: itemsCount },
      endings: { unlocked: endingsCount },
      deaths: { unlocked: deathsCount },
      totalUnlocked: eventsCount + talentsCount + traitsCount + itemsCount + endingsCount + deathsCount,
    }
  }

  const eventsUnlocked = pack.events.filter((e) => codex.unlockedEvents[e.id]).length
  const talentsUnlocked = pack.talents.filter((t) => codex.unlockedTalents[t.id]).length
  const traitsUnlocked = pack.traits.filter((t) => codex.unlockedTraits[t.id]).length
  const itemsUnlocked = pack.items.filter((i) => codex.unlockedItems[i.id]).length
  const endingsUnlocked = pack.endings.filter((e) => codex.unlockedEndings[e.id]).length

  const totalPackElements =
    pack.events.length + pack.talents.length + pack.traits.length + pack.items.length + pack.endings.length
  const totalPackUnlocked =
    eventsUnlocked + talentsUnlocked + traitsUnlocked + itemsUnlocked + endingsUnlocked

  const percentage =
    totalPackElements > 0 ? ((totalPackUnlocked / totalPackElements) * 100).toFixed(1) : '0.0'

  return {
    events: { unlocked: eventsUnlocked, total: pack.events.length },
    talents: { unlocked: talentsUnlocked, total: pack.talents.length },
    traits: { unlocked: traitsUnlocked, total: pack.traits.length },
    items: { unlocked: itemsUnlocked, total: pack.items.length },
    endings: { unlocked: endingsUnlocked, total: pack.endings.length },
    deaths: { unlocked: codex.deathCompendium.filter((d) => d.worldId === pack.manifest.id).length },
    totalUnlocked: totalPackUnlocked,
    totalElements: totalPackElements,
    percentage: `${percentage}%`,
  }
}
