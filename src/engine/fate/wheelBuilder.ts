import type { WheelSector, WheelSnapshot } from './wheelSnapshot'

export interface WheelCandidate {
  id: string
  title: string
  category?: string
  weight: number
  color?: string
}

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  daily: '#3b82f6', // 日常 (蓝)
  character: '#8b5cf6', // 人物 (紫)
  opportunity: '#eab308', // 机缘 (金/黄)
  crisis: '#ef4444', // 危机 (红)
  growth: '#10b981', // 成长 (绿)
  wealth: '#f97316', // 财富 (橙)
  special: '#ec4899', // 特殊 (粉)
}

/**
 * 根据候选事件与权重构建归一化的轮盘快照，并使用 RNG 决定旋转命中的扇区
 */
export function buildWheelSnapshot(
  candidates: WheelCandidate[],
  rng: () => number = Math.random,
  mode: 'single' | 'category' = 'single',
): WheelSnapshot {
  if (candidates.length === 0) {
    throw new Error('Cannot build WheelSnapshot from empty candidates.')
  }

  // 确保有效权重
  const validCandidates = candidates.map((c) => ({
    ...c,
    weight: Math.max(0, c.weight),
  }))

  const rawTotal = validCandidates.reduce((sum, c) => sum + c.weight, 0)
  const totalWeight = rawTotal > 0 ? rawTotal : validCandidates.length

  const sectors: WheelSector[] = validCandidates.map((c, index) => {
    const effectiveWeight = rawTotal > 0 ? c.weight : 1
    const prob = totalWeight > 0 ? effectiveWeight / totalWeight : 0
    const color =
      c.color ??
      (c.category ? DEFAULT_CATEGORY_COLORS[c.category] : undefined) ??
      `hsl(${(index * 360) / validCandidates.length}, 70%, 50%)`

    return {
      id: c.id,
      title: c.title,
      category: c.category,
      weight: effectiveWeight,
      probability: Number(prob.toFixed(4)),
      percentage: `${(prob * 100).toFixed(1)}%`,
      color,
    }
  })

  // 使用传入的 RNG 进行指针命中判定
  const rngValue = rng()
  let cursor = rngValue * totalWeight

  let selectedSector = sectors[sectors.length - 1]
  for (const s of sectors) {
    if (cursor <= s.weight) {
      selectedSector = s
      break
    }
    cursor -= s.weight
  }

  return {
    id: `wheel-${Date.now()}-${Math.floor(rng() * 10000)}`,
    createdAt: Date.now(),
    mode,
    sectors,
    totalWeight,
    selectedSectorId: selectedSector.id,
    selectedSector,
    rngValue,
  }
}
