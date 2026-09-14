import { evaluateCondition, type EvaluationContext } from './conditions'
import type { EventLibrary } from './library'
import type { EventDefinition } from './schema'

export interface EventPoolFilterOptions {
  recentEvents?: { eventId: string; occurredAtMonth?: number; occurredAtTurn?: number }[]
  currentMonth?: number
  currentTurn?: number
}

/**
 * 遍历事件库，根据玩家状态、世界状态、单局唯一性及冷却CD过滤出当前合法的事件池 (Event Pool)
 */
export function buildEventPool(
  library: EventLibrary,
  context: EvaluationContext,
  options: EventPoolFilterOptions = {},
): EventDefinition[] {
  const allEvents = library.getAllEvents()
  const { character } = context

  // 统计历史已经发生过的事件 ID
  const seenEventIds = new Set<string>()
  for (const h of character.history) {
    if (h.metadata?.eventId && typeof h.metadata.eventId === 'string') {
      seenEventIds.add(h.metadata.eventId)
    }
  }

  const pool: EventDefinition[] = []

  for (const event of allEvents) {
    // 1. 检查单局唯一限制
    if (event.oncePerRun && seenEventIds.has(event.id)) {
      continue
    }

    // 2. 检查冷却CD（按月或按轮次）
    if (event.cooldown && event.cooldown > 0 && options.recentEvents) {
      const isCoolingDown = options.recentEvents.some((r) => {
        if (r.eventId !== event.id) return false
        if (options.currentMonth !== undefined && r.occurredAtMonth !== undefined) {
          return options.currentMonth - r.occurredAtMonth < (event.cooldown ?? 0)
        }
        if (options.currentTurn !== undefined && r.occurredAtTurn !== undefined) {
          return options.currentTurn - r.occurredAtTurn < (event.cooldown ?? 0)
        }
        return true
      })
      if (isCoolingDown) {
        continue
      }
    }

    // 3. 检查静态前置条件
    if (event.conditions) {
      const valid = evaluateCondition(event.conditions, context)
      if (!valid) {
        continue
      }
    }

    pool.push(event)
  }

  return pool
}
