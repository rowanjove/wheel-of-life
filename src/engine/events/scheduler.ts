import type { CharacterState, ScheduledEvent, WorldState } from '../core/model'
import { evaluateCondition, type Condition } from './conditions'

export function createScheduledEvent(
  eventId: string,
  character: Pick<CharacterState, 'age' | 'currentYear'>,
  delayYears: number,
  options?: {
    conditions?: Condition
    sourceEventId?: string
    payload?: Record<string, unknown>
  },
): ScheduledEvent {
  const triggerYear = character.currentYear + delayYears
  const triggerAge = character.age + delayYears
  const id = `sched-${eventId}-${triggerYear}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    eventId,
    triggerYear,
    triggerAge,
    delayYears,
    conditions: options?.conditions,
    sourceEventId: options?.sourceEventId,
    payload: options?.payload,
  }
}

export function scheduleEvent(
  character: CharacterState,
  eventId: string,
  delayYears: number,
  options?: {
    conditions?: Condition
    sourceEventId?: string
    payload?: Record<string, unknown>
  },
): CharacterState {
  const scheduled = createScheduledEvent(eventId, character, delayYears, options)
  return {
    ...character,
    scheduledEvents: [...character.scheduledEvents, scheduled],
  }
}

export interface DueCheckResult {
  dueEvents: ScheduledEvent[]
  remainingEvents: ScheduledEvent[]
  character: CharacterState
}

export function popDueEvents(
  character: CharacterState,
  world?: WorldState,
): DueCheckResult {
  const dueEvents: ScheduledEvent[] = []
  const remainingEvents: ScheduledEvent[] = []

  for (const item of character.scheduledEvents) {
    const isYearDue = item.triggerYear !== undefined && character.currentYear >= item.triggerYear
    const isAgeDue = item.triggerAge !== undefined && character.age >= item.triggerAge
    const isTimeReached = isYearDue || isAgeDue

    if (isTimeReached) {
      const conditionPassed = item.conditions
        ? evaluateCondition(item.conditions as Condition, { character, world })
        : true

      if (conditionPassed) {
        dueEvents.push(item)
      } else {
        // Condition not satisfied yet; keep in schedule unless time has far surpassed
        remainingEvents.push(item)
      }
    } else {
      remainingEvents.push(item)
    }
  }

  return {
    dueEvents,
    remainingEvents,
    character: {
      ...character,
      scheduledEvents: remainingEvents,
    },
  }
}
