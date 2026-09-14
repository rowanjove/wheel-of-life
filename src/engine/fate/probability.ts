import type { Condition } from '../events/conditions'

export type ProbabilityMode =
  | 'fixed_chance'
  | 'static_weight'
  | 'dynamic_weight'
  | 'forced'

export type ModifierMode = 'multiply' | 'add' | 'override'

export interface ProbabilityModifier {
  condition?: Condition
  mode: ModifierMode
  value: number
  source?: string
}

export type EventProbability =
  | {
      mode: 'fixed_chance'
      chance: number // 绝对概率，例如 0.01 代表 1%
    }
  | {
      mode: 'static_weight'
      weight: number // 固定权重
    }
  | {
      mode: 'dynamic_weight'
      baseWeight: number // 基础权重
      modifiers?: ProbabilityModifier[]
    }
  | {
      mode: 'forced' // 必然发生
    }
