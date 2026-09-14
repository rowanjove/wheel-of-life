import type { CharacterState, EventWeightModifier, Modifier } from '../core/model'

export interface TalentDefinition {
  id: string
  name: string
  description: string
  rarity?: number // 1: 普通, 2: 稀有, 3: 史诗, 4: 传世
  incompatible?: string[] // 互斥天赋 ID 列表
  modifiers?: Modifier[] // 属性/关系直接加成
  eventWeightModifiers?: EventWeightModifier[] // 事件/标签权重倍率修正
  checkBonuses?: Record<string, number> // 判定检定加值，如 { knowledge: 2 }
  tags?: string[]
}

/**
 * 抽取开局天赋候选（默认抽取 6 个候选天赋）
 * 排除重复项与互斥项
 */
export function drawTalents(
  pool: TalentDefinition[],
  drawCount = 6,
  rng: () => number = Math.random,
): TalentDefinition[] {
  const available = [...pool]
  const drawn: TalentDefinition[] = []

  while (drawn.length < drawCount && available.length > 0) {
    const idx = Math.floor(rng() * available.length)
    const picked = available[idx]
    drawn.push(picked)
    available.splice(idx, 1)

    // 如果该天赋有互斥项，从剩余池中剔除互斥项
    if (picked.incompatible && picked.incompatible.length > 0) {
      const incompSet = new Set(picked.incompatible)
      for (let i = available.length - 1; i >= 0; i--) {
        if (incompSet.has(available[i].id)) {
          available.splice(i, 1)
        }
      }
    }
  }

  return drawn
}

/**
 * 校验玩家选择的天赋是否合法（数量上限、互相之间不得互斥）
 */
export function validateTalentSelection(
  selected: TalentDefinition[],
  maxCount = 3,
): { valid: boolean; reason?: string } {
  if (selected.length > maxCount) {
    return { valid: false, reason: `选择天赋数量超出上限（最多 ${maxCount} 个）` }
  }

  const idSet = new Set<string>()
  for (const t of selected) {
    if (idSet.has(t.id)) {
      return { valid: false, reason: `不能重复选择天赋：${t.name}` }
    }
    idSet.add(t.id)
  }

  for (const t of selected) {
    if (t.incompatible) {
      for (const incompId of t.incompatible) {
        if (idSet.has(incompId)) {
          return {
            valid: false,
            reason: `天赋【${t.name}】与所选的其他天赋互斥`,
          }
        }
      }
    }
  }

  return { valid: true }
}

/**
 * 将天赋生效到角色状态中
 */
export function applyTalentToCharacter(
  character: CharacterState,
  talent: TalentDefinition,
): CharacterState {
  let updated = {
    ...character,
    talents: character.talents ? [...character.talents, talent.id] : [talent.id],
  }

  if (talent.modifiers) {
    for (const mod of talent.modifiers) {
      if (mod.target === 'stat') {
        const cur = updated.stats[mod.key] ?? 0
        const val = mod.mode === 'multiply' ? cur * mod.value : cur + mod.value
        updated = {
          ...updated,
          stats: {
            ...updated.stats,
            [mod.key]: val,
          },
        }
      }
    }
  }

  return updated
}
