import { evaluateCondition, type EvaluationContext } from '../events/conditions'
import type { ModifierMode, ProbabilityModifier } from './probability'

export interface ProbabilityModifierEntry {
  source: string
  mode: ModifierMode
  value: number
  applied: boolean
}

export interface ProbabilityBreakdown {
  eventId?: string
  baseWeight: number
  finalWeight: number
  entries: ProbabilityModifierEntry[]
}

/**
 * 实时计算动态事件权重，并输出可供 Debug / Probability Inspector 审计的详细追踪记录
 */
export function calculateDynamicWeight(
  baseWeight: number,
  modifiers: ProbabilityModifier[] = [],
  context: EvaluationContext,
  externalModifiers: ProbabilityModifier[] = [],
): ProbabilityBreakdown {
  let currentWeight = Math.max(0, baseWeight)
  const entries: ProbabilityModifierEntry[] = []

  const allModifiers = [...modifiers, ...externalModifiers]

  for (const mod of allModifiers) {
    const isApplicable = mod.condition ? evaluateCondition(mod.condition, context) : true

    if (isApplicable) {
      if (mod.mode === 'override') {
        currentWeight = Math.max(0, mod.value)
      } else if (mod.mode === 'multiply') {
        currentWeight *= Math.max(0, mod.value)
      } else if (mod.mode === 'add') {
        currentWeight = Math.max(0, currentWeight + mod.value)
      }

      entries.push({
        source: mod.source ?? '未知来源',
        mode: mod.mode,
        value: mod.value,
        applied: true,
      })
    } else {
      entries.push({
        source: mod.source ?? '未知来源',
        mode: mod.mode,
        value: mod.value,
        applied: false,
      })
    }
  }

  // 保证权重非负
  const finalWeight = Math.max(0, Number(currentWeight.toFixed(4)))

  return {
    baseWeight,
    finalWeight,
    entries,
  }
}
