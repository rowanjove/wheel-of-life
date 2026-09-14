import type { CharacterState, ItemDefinition, WorldState } from '../core/model'
import type { EvaluationContext } from '../events/conditions'
import type { EventLibrary } from '../events/library'
import { buildEventPool, type EventPoolFilterOptions } from '../events/pool'
import type { EventQueue } from '../events/queue'
import type { EventDefinition } from '../events/schema'
import { calculateDynamicWeight, type ProbabilityBreakdown } from './modifiers'
import { getPityModifiers, type StreakTracker } from './pity'
import type { ProbabilityModifier } from './probability'
import { buildWheelSnapshot, type WheelCandidate } from './wheelBuilder'
import type { WheelSnapshot } from './wheelSnapshot'

export interface FateResolutionResult {
  type: 'forced' | 'fixed_chance' | 'wheel'
  selectedEvent: EventDefinition
  snapshot?: WheelSnapshot
  breakdown?: ProbabilityBreakdown
  candidateBreakdowns?: Record<string, ProbabilityBreakdown>
  eligiblePoolSize: number
}

export interface FateResolveOptions extends EventPoolFilterOptions {
  wheelMode?: 'single' | 'category'
  streakTracker?: StreakTracker
  itemDefinitions?: ItemDefinition[]
  externalModifiers?: (event: EventDefinition) => ProbabilityModifier[]
}

/**
 * 收集针对某一候选事件生效的外部加权（保底防连续、随身背包辐射、回调加权等）
 */
export function collectExternalModifiers(
  event: EventDefinition,
  character: CharacterState,
  options: FateResolveOptions,
): ProbabilityModifier[] {
  const mods: ProbabilityModifier[] = []

  // 1. 保底防连续机制 (Pity / Anti-streak)
  if (options.streakTracker) {
    const pity = getPityModifiers(options.streakTracker)
    if (event.category === 'opportunity' || event.category === 'special') {
      if (pity.opportunityMultiplier !== 1.0) {
        mods.push({
          mode: 'multiply',
          value: pity.opportunityMultiplier,
          source: `机缘保底机制 (连续 ${options.streakTracker.opportunityDroughtTurns} 轮未出现)`,
        })
      }
    }
    if (event.category === 'crisis') {
      if (pity.crisisMultiplier !== 1.0) {
        mods.push({
          mode: 'multiply',
          value: pity.crisisMultiplier,
          source: '高危事件防连击保护',
        })
      }
    }
  }

  // 2. 背包随身物品辐射加权 (Item Radiation)
  if (options.itemDefinitions && character.inventory && character.inventory.length > 0) {
    for (const item of character.inventory) {
      if ((item.quantity ?? 1) <= 0) continue
      const itemDef = options.itemDefinitions.find((d) => d.id === item.id)
      if (!itemDef?.eventWeightModifiers) continue

      for (const ewm of itemDef.eventWeightModifiers) {
        let match = false
        if (ewm.eventId && ewm.eventId === event.id) match = true
        if (ewm.tag && event.tags?.includes(ewm.tag)) match = true
        if (ewm.category && event.category === ewm.category) match = true

        if (match) {
          mods.push({
            mode: 'multiply',
            value: ewm.multiplier,
            source: `随身物品【${itemDef.name}】加权`,
          })
        }
      }
    }
  }

  // 3. 外部自定义回调修正
  if (options.externalModifiers) {
    mods.push(...options.externalModifiers(event))
  }

  return mods
}

/**
 * 命运解析器流水线 (Fate Resolver Engine)
 * 严格按照 WOL 2.0 标准执行顺序：
 * 1. 检查 EventQueue 强制剧情
 * 2. 独立检定 Fixed Chance 绝对概率事件
 * 3. 过滤当前合法 EventPool
 * 4. 实时计算动态权重 (Dynamic Weight) 与修正链
 * 5. 构建并冻结 WheelSnapshot
 * 6. 通过 Seeded RNG 转动轮盘选定事件
 */
export function resolveNextFate(
  library: EventLibrary,
  queue: EventQueue,
  character: CharacterState,
  world?: WorldState,
  rng: () => number = Math.random,
  options: FateResolveOptions = {},
): FateResolutionResult {
  const context: EvaluationContext = { character, world }

  // 1. 检查队列中是否存在强制剧情
  if (!queue.isEmpty()) {
    const forcedId = queue.pop()
    if (forcedId) {
      const forcedEvent = library.getEvent(forcedId)
      if (forcedEvent) {
        return {
          type: 'forced',
          selectedEvent: forcedEvent,
          eligiblePoolSize: 1,
        }
      }
    }
  }

  // 2. 过滤当前条件满足的合法事件池 (Event Pool)
  let eligiblePool = buildEventPool(library, context, options)
  if (eligiblePool.length === 0) {
    const fallbackEvent: EventDefinition = {
      id: `ev-fallback-${character.age}`,
      title: '流年静好',
      text: '这一年时光静静流淌，生活平淡而安宁。',
      category: 'daily',
      probability: { mode: 'static_weight', weight: 10 },
      timeCost: 12,
    }
    eligiblePool = [fallbackEvent]
  }

  // 3. 检查独立绝对概率事件 (Fixed Chance Events)
  const fixedChanceEvents = eligiblePool.filter(
    (e) => e.probability.mode === 'fixed_chance',
  )
  for (const fEvent of fixedChanceEvents) {
    if (fEvent.probability.mode === 'fixed_chance') {
      const roll = rng()
      if (roll < fEvent.probability.chance) {
        return {
          type: 'fixed_chance',
          selectedEvent: fEvent,
          eligiblePoolSize: eligiblePool.length,
        }
      }
    }
  }

  // 4. 构建可参与轮盘的候选列表 (Static / Dynamic Weight)
  const wheelEligible = eligiblePool.filter(
    (e) => e.probability.mode !== 'fixed_chance' && e.probability.mode !== 'forced',
  )

  const candidatesPool = wheelEligible.length > 0 ? wheelEligible : eligiblePool

  const breakdowns: Map<string, ProbabilityBreakdown> = new Map()
  const candidates: WheelCandidate[] = []

  for (const ev of candidatesPool) {
    const extMods = collectExternalModifiers(ev, character, options)
    let finalWeight = 1
    let bd: ProbabilityBreakdown

    if (ev.probability.mode === 'static_weight') {
      bd = calculateDynamicWeight(ev.probability.weight, [], context, extMods)
      finalWeight = bd.finalWeight
    } else if (ev.probability.mode === 'dynamic_weight') {
      bd = calculateDynamicWeight(
        ev.probability.baseWeight,
        ev.probability.modifiers ?? [],
        context,
        extMods,
      )
      finalWeight = bd.finalWeight
    } else {
      bd = { baseWeight: 1, finalWeight: 1, entries: [] }
      finalWeight = 1
    }

    breakdowns.set(ev.id, bd)

    if (finalWeight > 0) {
      candidates.push({
        id: ev.id,
        title: ev.title,
        category: ev.category,
        weight: finalWeight,
      })
    }
  }

  // 若所有权重均被清零，兜底均匀赋权
  if (candidates.length === 0) {
    for (const ev of candidatesPool) {
      candidates.push({
        id: ev.id,
        title: ev.title,
        category: ev.category,
        weight: 1,
      })
    }
  }

  // 5. 构建并冻结轮盘快照 (WheelSnapshot)
  const snapshot = buildWheelSnapshot(candidates, rng, options.wheelMode ?? 'single')

  // 6. 确定命中的事件
  const selectedEvent = library.getEvent(snapshot.selectedSectorId) ?? candidatesPool[0]

  return {
    type: 'wheel',
    selectedEvent,
    snapshot,
    breakdown: breakdowns.get(selectedEvent.id),
    candidateBreakdowns: Object.fromEntries(breakdowns.entries()),
    eligiblePoolSize: eligiblePool.length,
  }
}

/**
 * 实时诊断/透视当前事件池状态（只读，不消耗随机数或执行转动）
 */
export function inspectCandidatePool(
  library: EventLibrary,
  queue: EventQueue,
  character: CharacterState,
  world?: WorldState,
  options: FateResolveOptions = {},
) {
  const context: EvaluationContext = { character, world }
  const eligiblePool = buildEventPool(library, context, options)
  const wheelEligible = eligiblePool.filter(
    (e) => e.probability.mode !== 'fixed_chance' && e.probability.mode !== 'forced',
  )
  const candidatesPool = wheelEligible.length > 0 ? wheelEligible : eligiblePool

  const breakdowns: Map<string, ProbabilityBreakdown> = new Map()
  const candidates: WheelCandidate[] = []

  for (const ev of candidatesPool) {
    const extMods = collectExternalModifiers(ev, character, options)
    let bd: ProbabilityBreakdown

    if (ev.probability.mode === 'static_weight') {
      bd = calculateDynamicWeight(ev.probability.weight, [], context, extMods)
    } else if (ev.probability.mode === 'dynamic_weight') {
      bd = calculateDynamicWeight(
        ev.probability.baseWeight,
        ev.probability.modifiers ?? [],
        context,
        extMods,
      )
    } else {
      bd = { baseWeight: 1, finalWeight: 1, entries: [] }
    }

    breakdowns.set(ev.id, bd)
    if (bd.finalWeight > 0) {
      candidates.push({
        id: ev.id,
        title: ev.title,
        category: ev.category,
        weight: bd.finalWeight,
      })
    }
  }

  const totalWeight = candidates.reduce((acc, c) => acc + c.weight, 0)
  const pityInfo = options.streakTracker ? getPityModifiers(options.streakTracker) : undefined

  return {
    eligiblePool,
    candidates: candidates.map((c) => ({
      ...c,
      probability: totalWeight > 0 ? c.weight / totalWeight : 0,
      percentage: totalWeight > 0 ? `${((c.weight / totalWeight) * 100).toFixed(1)}%` : '0%',
    })),
    totalWeight,
    breakdowns: Object.fromEntries(breakdowns.entries()),
    pityStatus: options.streakTracker
      ? {
          opportunityDroughtTurns: options.streakTracker.opportunityDroughtTurns,
          opportunityMultiplier: pityInfo?.opportunityMultiplier ?? 1.0,
          recentCrisisTurns: options.streakTracker.recentCrisisTurns,
          crisisMultiplier: pityInfo?.crisisMultiplier ?? 1.0,
        }
      : undefined,
  }
}
