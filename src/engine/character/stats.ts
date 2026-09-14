import type { CharacterState, StatMap } from '../core/model'

export interface StatDefinition {
  id: string
  name: string
  description?: string
  min: number
  max: number
  initial: number
  isStatus?: boolean // true for dynamic status stats (health, stress, wealth), false for base stats
}

export type PointAllocationMode = 'manual' | 'random' | 'average'

export interface PointAllocationResult {
  allocated: StatMap
  remainingPoints: number
}

/**
 * 限制属性在预设的 min/max 范围内
 */
export function clampStat(
  value: number,
  statDef?: Pick<StatDefinition, 'min' | 'max'>,
): number {
  if (!statDef) return value
  return Math.min(statDef.max, Math.max(statDef.min, value))
}

/**
 * 修改角色属性，自动遵守属性上下限
 */
export function modifyCharacterStat(
  character: CharacterState,
  statKey: string,
  delta: number,
  statDefs?: Record<string, StatDefinition>,
): CharacterState {
  const current = character.stats[statKey] ?? 0
  const updated = current + delta
  const def = statDefs?.[statKey]
  const clamped = clampStat(updated, def)

  return {
    ...character,
    stats: {
      ...character.stats,
      [statKey]: clamped,
    },
  }
}

/**
 * 批量修改角色属性
 */
export function modifyCharacterStats(
  character: CharacterState,
  deltas: StatMap,
  statDefs?: Record<string, StatDefinition>,
): CharacterState {
  let updated = character
  for (const [k, v] of Object.entries(deltas)) {
    updated = modifyCharacterStat(updated, k, v, statDefs)
  }
  return updated
}

/**
 * 开局属性点分配算法
 * 支持手动分配、全随机分配、平均分配
 */
export function allocateInitialPoints(
  availablePoints: number,
  stats: StatDefinition[],
  mode: PointAllocationMode,
  options?: {
    manualChoices?: StatMap
    rng?: () => number
  },
): PointAllocationResult {
  const allocated: StatMap = {}
  stats.forEach((s) => {
    allocated[s.id] = s.initial
  })

  let remaining = availablePoints

  if (mode === 'average') {
    const statCount = stats.length
    if (statCount === 0) return { allocated, remainingPoints: remaining }

    const perStat = Math.floor(remaining / statCount)
    for (const stat of stats) {
      const add = Math.min(perStat, stat.max - allocated[stat.id])
      allocated[stat.id] += add
      remaining -= add
    }
    // 余数尽可能从前往后分配
    for (const stat of stats) {
      if (remaining <= 0) break
      if (allocated[stat.id] < stat.max) {
        allocated[stat.id] += 1
        remaining -= 1
      }
    }
  } else if (mode === 'random') {
    const rng = options?.rng ?? Math.random
    const validStats = [...stats]
    while (remaining > 0 && validStats.length > 0) {
      const idx = Math.floor(rng() * validStats.length)
      const targetStat = validStats[idx]
      if (allocated[targetStat.id] < targetStat.max) {
        allocated[targetStat.id] += 1
        remaining -= 1
      } else {
        // 该属性已达上限，移出随机池
        validStats.splice(idx, 1)
      }
    }
  } else if (mode === 'manual') {
    const choices = options?.manualChoices ?? {}
    for (const stat of stats) {
      const requestedAdd = choices[stat.id] ?? 0
      if (requestedAdd > 0) {
        const canAdd = Math.min(requestedAdd, remaining, stat.max - allocated[stat.id])
        allocated[stat.id] += canAdd
        remaining -= canAdd
      }
    }
  }

  return { allocated, remainingPoints: remaining }
}
