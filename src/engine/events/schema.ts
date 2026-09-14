import type { Condition } from './conditions'
import type { EventProbability } from '../fate/probability'

export type EventCategory =
  | 'daily'
  | 'character'
  | 'opportunity'
  | 'crisis'
  | 'growth'
  | 'wealth'
  | 'special'
  | string

export interface StatCheck {
  stat: string
  difficulty: number // 检定阈值，如 60
  bonus?: number // 额外加成
}

export interface ResultBranch {
  id?: string
  condition?: Condition // 静态前置条件
  check?: StatCheck // 动态属性/掷骰检定
  text: string // 结果文字描述
  effects?: Effect[] // 产生的结果效果
}

export interface EventOption {
  id: string
  text: string
  description?: string
  conditions?: Condition // 选项解锁前置条件（如需持有特定道具/特质）
  effects?: Effect[] // 直接效果（无检定分支时）
  branches?: ResultBranch[] // 互斥结果分支（根据属性或检定决定走向）
}

export interface FollowUp {
  eventId: string
  delayMonths?: number
  delayYears?: number
  condition?: Condition
}

export type Effect =
  | { type: 'modify_stat'; key: string; value: number }
  | { type: 'set_stat'; key: string; value: number }
  | { type: 'modify_status'; key: string; value: number }
  | { type: 'add_talent'; talentId: string }
  | { type: 'remove_talent'; talentId: string }
  | { type: 'add_trait'; traitId: string }
  | { type: 'remove_trait'; traitId: string }
  | { type: 'add_item'; itemId: string; name?: string; quantity?: number }
  | { type: 'remove_item'; itemId: string; quantity?: number }
  | { type: 'add_flag'; flag: string }
  | { type: 'remove_flag'; flag: string }
  | {
      type: 'add_memory'
      memoryType: string
      tags?: string[]
      data?: Record<string, unknown>
    }
  | { type: 'modify_relation'; target: string; value: number }
  | { type: 'modify_faction'; faction: string; value: number }
  | { type: 'queue_event'; eventId: string }
  | {
      type: 'schedule_event'
      eventId: string
      delayMonths?: number
      delayYears?: number
    }
  | { type: 'advance_age'; months: number }
  | { type: 'trigger_ending'; endingId: string; reason?: string }

export interface EventDefinition {
  id: string
  title: string
  text: string
  category?: EventCategory
  conditions?: Condition
  probability: EventProbability
  options?: EventOption[] // 若为空数组或 undefined，则为即时事件 (Instant Event)
  directEffects?: Effect[] // 即时事件的直接效果，或触发选项前的共用效果
  followUps?: FollowUp[]
  tags?: string[]
  cooldown?: number // 冷却月数（防止连续发生）
  oncePerRun?: boolean // 单局人生仅触发一次
  timeCost?: number // 该事件消耗月数（默认 12 个月即 1 年）
}
