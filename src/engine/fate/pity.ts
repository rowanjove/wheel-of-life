import type { ProbabilityModifier } from './probability'

export interface StreakTracker {
  opportunityDroughtTurns: number // 连续未出现机缘/奇遇的轮次数
  recentCrisisTurns: number // 距上次遭遇危机事件经过的轮次数
}

export function createStreakTracker(): StreakTracker {
  return {
    opportunityDroughtTurns: 0,
    recentCrisisTurns: 999,
  }
}

export function updateStreakTracker(
  tracker: StreakTracker,
  selectedCategory?: string,
): StreakTracker {
  const isOpportunity = selectedCategory === 'opportunity' || selectedCategory === 'special'
  const isCrisis = selectedCategory === 'crisis'

  return {
    opportunityDroughtTurns: isOpportunity ? 0 : tracker.opportunityDroughtTurns + 1,
    recentCrisisTurns: isCrisis ? 0 : tracker.recentCrisisTurns + 1,
  }
}

/**
 * 根据连击追踪状态生成隐藏保底与防连续概率修正器
 */
export function getPityModifiers(tracker: StreakTracker): {
  opportunityMultiplier: number
  crisisMultiplier: number
  modifiers: ProbabilityModifier[]
} {
  const modifiers: ProbabilityModifier[] = []
  let opportunityMultiplier = 1.0
  let crisisMultiplier = 1.0

  // 1. 机缘保底：连续 6 轮以上未出现机缘，每多一轮机缘事件权重提升 25%
  if (tracker.opportunityDroughtTurns >= 6) {
    const extra = (tracker.opportunityDroughtTurns - 5) * 0.25
    opportunityMultiplier = 1.0 + Math.min(extra, 2.5) // 上限加成 3.5 倍
    modifiers.push({
      mode: 'multiply',
      value: opportunityMultiplier,
      source: `机缘保底机制 (连续 ${tracker.opportunityDroughtTurns} 轮未出现)`,
    })
  }

  // 2. 危机防连击：刚发生过重大危机（2 轮以内），危机事件权重暂时降低至 40%，避免连续暴毙
  if (tracker.recentCrisisTurns <= 2) {
    crisisMultiplier = 0.4
    modifiers.push({
      mode: 'multiply',
      value: crisisMultiplier,
      source: '高危事件防连击保护',
    })
  }

  return {
    opportunityMultiplier,
    crisisMultiplier,
    modifiers,
  }
}
