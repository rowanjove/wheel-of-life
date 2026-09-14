import type { CharacterState, WorldState } from '../core/model'

export type ComparisonOperator = '>' | '>=' | '<' | '<=' | '==' | '!='

export type AgeCondition =
  | { gte?: number; lte?: number; eq?: number; gt?: number; lt?: number }
  | { op: ComparisonOperator; value: number }

export type StatCondition = {
  stat: string
  op: ComparisonOperator
  value: number
}

export type TraitCondition = {
  trait: string
  has?: boolean
}

export type FlagCondition = {
  flag: string
  has?: boolean
}

export type ItemCondition = {
  item: string
  has?: boolean
  quantity?: number
}

export type MemoryCondition = {
  memory: string // matches type or tag
  has?: boolean
}

export type FactionCondition = {
  faction: string
  op: ComparisonOperator
  value: number
}

export type RelationshipCondition = {
  relationship: string
  op: ComparisonOperator
  value: number
}

export type OriginCondition = {
  origin: string
}

export type CareerCondition = {
  career: string
}

export type WorldVariableCondition = {
  worldVariable: string
  op: ComparisonOperator
  value: number | string | boolean
}

export type WorldEventCondition = {
  worldEvent: string
  active?: boolean
}

export type TalentCondition = {
  talent: string
  has?: boolean
}

export type StatusCondition = {
  status: string
  op: ComparisonOperator
  value: number
}

export type SeenEventCondition = {
  seenEvent: string
  has?: boolean
}

export type AtomicCondition =
  | StatCondition
  | StatusCondition
  | { age: AgeCondition }
  | TalentCondition
  | TraitCondition
  | FlagCondition
  | ItemCondition
  | MemoryCondition
  | FactionCondition
  | RelationshipCondition
  | OriginCondition
  | CareerCondition
  | WorldVariableCondition
  | WorldEventCondition
  | SeenEventCondition

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | AtomicCondition

function compareNumbers(actual: number, op: ComparisonOperator, expected: number): boolean {
  switch (op) {
    case '>':
      return actual > expected
    case '>=':
      return actual >= expected
    case '<':
      return actual < expected
    case '<=':
      return actual <= expected
    case '==':
      return actual === expected
    case '!=':
      return actual !== expected
    default:
      return false
  }
}

function compareValues(actual: unknown, op: ComparisonOperator, expected: unknown): boolean {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return compareNumbers(actual, op, expected)
  }
  if (op === '==') return actual === expected
  if (op === '!=') return actual !== expected
  return false
}

export interface EvaluationContext {
  character: CharacterState
  world?: WorldState
}

export function evaluateCondition(
  condition: Condition | undefined | null,
  context: EvaluationContext,
): boolean {
  if (!condition) return true

  // Logical operators
  if ('all' in condition && Array.isArray(condition.all)) {
    return condition.all.every((c) => evaluateCondition(c, context))
  }
  if ('any' in condition && Array.isArray(condition.any)) {
    return condition.any.some((c) => evaluateCondition(c, context))
  }
  if ('not' in condition && condition.not) {
    return !evaluateCondition(condition.not, context)
  }

  const { character, world } = context

  // Stat condition
  if ('stat' in condition) {
    const val = character.stats[condition.stat] ?? 0
    return compareNumbers(val, condition.op, condition.value)
  }

  // Age condition
  if ('age' in condition) {
    const ageCond = condition.age
    if ('op' in ageCond) {
      return compareNumbers(character.age, ageCond.op, ageCond.value)
    }
    if (ageCond.eq !== undefined && character.age !== ageCond.eq) return false
    if (ageCond.gte !== undefined && character.age < ageCond.gte) return false
    if (ageCond.lte !== undefined && character.age > ageCond.lte) return false
    if (ageCond.gt !== undefined && character.age <= ageCond.gt) return false
    if (ageCond.lt !== undefined && character.age >= ageCond.lt) return false
    return true
  }

  // Status dynamic condition (health, stress, wealth, etc.)
  if ('status' in condition) {
    const val = character.status?.[condition.status] ?? character.stats[condition.status] ?? 0
    return compareNumbers(val, condition.op, condition.value)
  }

  // Talent condition
  if ('talent' in condition) {
    const has = character.talents ? character.talents.includes(condition.talent) : false
    return condition.has !== false ? has : !has
  }

  // Trait condition
  if ('trait' in condition) {
    const has = character.traits.includes(condition.trait)
    return condition.has !== false ? has : !has
  }

  // Seen Event condition
  if ('seenEvent' in condition) {
    const has = character.history.some(
      (h) => h.metadata?.eventId === condition.seenEvent || h.title.includes(condition.seenEvent),
    )
    return condition.has !== false ? has : !has
  }

  // Flag condition
  if ('flag' in condition) {
    const has = character.flags.includes(condition.flag)
    return condition.has !== false ? has : !has
  }

  // Item condition
  if ('item' in condition) {
    const itemEntry = character.inventory.find((i) => i.id === condition.item)
    const requiredQty = condition.quantity ?? 1
    const actualQty = itemEntry ? (itemEntry.quantity ?? 1) : 0
    const has = actualQty >= requiredQty
    return condition.has !== false ? has : !has
  }

  // Memory condition
  if ('memory' in condition) {
    const has = character.memories.some(
      (m) => m.type === condition.memory || m.tags.includes(condition.memory),
    )
    return condition.has !== false ? has : !has
  }

  // Faction relation condition
  if ('faction' in condition) {
    const val = character.factionRelations[condition.faction] ?? 0
    return compareNumbers(val, condition.op, condition.value)
  }

  // Relationship condition
  if ('relationship' in condition) {
    const val = character.relationships[condition.relationship] ?? 0
    return compareNumbers(val, condition.op, condition.value)
  }

  // Origin condition
  if ('origin' in condition) {
    return character.originId === condition.origin
  }

  // Career condition
  if ('career' in condition) {
    return character.careerId === condition.career
  }

  // World variable condition
  if ('worldVariable' in condition) {
    if (!world) return false
    const val = world.variables[condition.worldVariable]
    return compareValues(val, condition.op, condition.value)
  }

  // World active event condition
  if ('worldEvent' in condition) {
    if (!world) return false
    const has = world.activeEvents.includes(condition.worldEvent)
    return condition.active !== false ? has : !has
  }

  return true
}
