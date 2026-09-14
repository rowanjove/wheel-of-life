import type { CharacterState, TraitDefinition } from '../core/model'

/**
 * 检查角色是否拥有指定特质
 */
export function hasTrait(character: CharacterState, traitId: string): boolean {
  return character.traits.includes(traitId)
}

/**
 * 向角色赋予后天特质
 * 自动处理特质替换（replacements）与互斥清除（incompatible）
 */
export function addTrait(
  character: CharacterState,
  trait: TraitDefinition,
): CharacterState {
  if (character.traits.includes(trait.id)) {
    return character
  }

  let nextTraits = [...character.traits]

  // 1. 处理显式替换（例如高级特质替换初级特质）
  if (trait.replacements && trait.replacements.length > 0) {
    const replaceSet = new Set(trait.replacements)
    nextTraits = nextTraits.filter((t) => !replaceSet.has(t))
  }

  // 2. 处理互斥关系（移除与新特质冲突的旧特质）
  if (trait.incompatible && trait.incompatible.length > 0) {
    const incompSet = new Set(trait.incompatible)
    nextTraits = nextTraits.filter((t) => !incompSet.has(t))
  }

  nextTraits.push(trait.id)

  let updated: CharacterState = {
    ...character,
    traits: nextTraits,
  }

  // 应用特质自带的基础属性修正
  if (trait.modifiers) {
    for (const mod of trait.modifiers) {
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

/**
 * 移除角色的特质
 */
export function removeTrait(
  character: CharacterState,
  traitId: string,
): CharacterState {
  if (!character.traits.includes(traitId)) {
    return character
  }

  return {
    ...character,
    traits: character.traits.filter((t) => t !== traitId),
  }
}
