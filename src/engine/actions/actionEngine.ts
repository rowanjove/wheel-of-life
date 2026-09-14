import type { CharacterState } from '../core/model'
import type { ModernActionDefinition } from '../../worlds/default-modern'

export function canPerformAction(
  action: ModernActionDefinition,
  character: CharacterState,
): { allowed: boolean; reason?: string } {
  if (character.age < action.minAge) {
    return { allowed: false, reason: `年龄尚未达到要求 (需要 ${action.minAge} 岁)` }
  }
  if (action.maxAge !== undefined && character.age > action.maxAge) {
    return { allowed: false, reason: `已超过适用年龄 (最高 ${action.maxAge} 岁)` }
  }

  // Cost checks
  if (action.cost.wealth && (character.stats.wealth ?? 0) < action.cost.wealth) {
    return { allowed: false, reason: `财富不足 (需要 ${action.cost.wealth})` }
  }
  if (action.cost.health && (character.stats.health ?? 0) <= action.cost.health) {
    return { allowed: false, reason: '身体过于虚弱，无法支持该行动' }
  }

  return { allowed: true }
}

export function performAction(
  action: ModernActionDefinition,
  character: CharacterState,
): CharacterState {
  const check = canPerformAction(action, character)
  if (!check.allowed) {
    throw new Error(`无法执行行动【${action.name}】：${check.reason}`)
  }

  const stats = { ...character.stats }

  // Deduct costs
  if (action.cost.wealth) stats.wealth = (stats.wealth ?? 0) - action.cost.wealth
  if (action.cost.health) stats.health = (stats.health ?? 0) - action.cost.health
  if (action.cost.stress) stats.stress = (stats.stress ?? 0) + action.cost.stress

  // Apply Trait modifiers
  let knowledgeMultiplier = 1.0
  let stressReductionBonus = 0
  if (character.traits.includes('trait-photographic-memory')) knowledgeMultiplier += 0.3
  if (character.traits.includes('trait-curious')) knowledgeMultiplier += 0.2
  if (character.traits.includes('trait-resilient')) stressReductionBonus += 2

  // Apply effects
  if (action.effects.knowledge) {
    stats.knowledge = (stats.knowledge ?? 0) + Math.round(action.effects.knowledge * knowledgeMultiplier)
  }
  if (action.effects.wealth) {
    stats.wealth = (stats.wealth ?? 0) + action.effects.wealth
  }
  if (action.effects.health) {
    stats.health = Math.min(100, (stats.health ?? 0) + action.effects.health)
  }
  if (action.effects.charisma) {
    stats.charisma = Math.min(100, (stats.charisma ?? 0) + action.effects.charisma)
  }
  if (action.effects.reputation) {
    stats.reputation = Math.min(100, (stats.reputation ?? 0) + action.effects.reputation)
  }
  if (action.effects.stress) {
    let delta = action.effects.stress
    if (delta < 0) delta -= stressReductionBonus
    stats.stress = Math.max(0, Math.min(100, (stats.stress ?? 0) + delta))
  }

  // Record into life history
  const historyEntry = {
    age: character.age,
    year: character.currentYear,
    title: `主动决策：${action.name}`,
    description: action.description,
    type: 'choice' as const,
  }

  return {
    ...character,
    stats,
    history: [...character.history, historyEntry],
  }
}
