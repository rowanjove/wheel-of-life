import { normalizeCharacter } from '../engine/factory'
import {
  ABSOLUTE_MAX_LEVEL,
  DEFAULT_MAX_LEVEL,
} from '../engine/progression'
import { normalizeBones } from '../engine/bones'
import {
  RUN_VERSION,
  type ActivityStatus,
  type FlowPhase,
  type RewriteCharacter,
  type RewriteRun,
  type RingState,
  type SpiritState,
  type ValidSnapshot,
} from '../engine/model'

export type ValidationResult =
  | { ok: true; run: RewriteRun }
  | { ok: false; reason: string }

const phases = new Set<FlowPhase>([
  'creation',
  'primary-school',
  'middle-school',
  'high-school',
  'contest',
  'adult',
  'soul-beast',
  'ending',
])

const statuses = new Set<ActivityStatus>([
  'ready',
  'animating',
  'result-pending',
  'choice-pending',
  'completed',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function isSpirit(value: unknown): value is SpiritState {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.quality === 'string' &&
    Array.isArray(value.fusionIds)
  )
}

function validRings(rings: unknown): rings is RingState[] {
  if (!Array.isArray(rings) || rings.length > 9) return false
  let previousYears = 0
  return rings.every((ring, position) => {
    if (!isRecord(ring)) return false
    const valid = (
      ring.index === position + 1 &&
      isInteger(ring.years) &&
      ring.years > previousYears &&
      typeof ring.id === 'string' &&
      typeof ring.quality === 'string'
    )
    if (valid) previousYears = ring.years as number
    return valid
  })
}

function validFlow(value: unknown) {
  if (!isRecord(value)) return false
  return (
    typeof value.phase === 'string' &&
    phases.has(value.phase as FlowPhase) &&
    typeof value.step === 'string' &&
    typeof value.status === 'string' &&
    statuses.has(value.status as ActivityStatus)
  )
}

function resolveMaxLevel(value: Record<string, unknown>): number {
  if (isInteger(value.maxLevel)) return value.maxLevel
  return DEFAULT_MAX_LEVEL
}

function validCharacter(value: unknown, allowIncompleteSpirits = false) {
  if (!isRecord(value)) return false
  if (!isInteger(value.level) || !isInteger(value.birthYear) || !isInteger(value.currentYear)) {
    return false
  }
  const maxLevel = resolveMaxLevel(value)
  if (
    maxLevel < DEFAULT_MAX_LEVEL ||
    maxLevel > ABSOLUTE_MAX_LEVEL ||
    value.level > maxLevel
  ) {
    return false
  }
  if (!isInteger(value.spiritCount) || value.spiritCount < 0 || value.spiritCount > 4) {
    return false
  }
  if (
    !Array.isArray(value.spirits) ||
    (allowIncompleteSpirits
      ? value.spirits.length > value.spiritCount
      : value.spirits.length !== value.spiritCount)
  ) {
    return false
  }
  const legacyRings = (value as Record<string, unknown>)[['soul', 'Rings'].join('')]
  return value.spirits.every(isSpirit) && validRings((value as any).rings ?? legacyRings)
}

function allowsIncompleteSpirits(flow: unknown): boolean {
  if (!isRecord(flow) || flow.phase !== 'creation' || typeof flow.step !== 'string') {
    return false
  }
  return (
    /^spirit-\d+(-category)?$/.test(flow.step) ||
    flow.step === 'innate-power' ||
    flow.step === 'talent' ||
    flow.step === 'creation-summary'
  )
}

export function isValidSnapshot(value: unknown): value is ValidSnapshot {
  if (!isRecord(value)) return false
  return (
    typeof value.createdAt === 'string' &&
    isInteger(value.rngCursor) &&
    value.rngCursor >= 0 &&
    validCharacter(value.character, allowsIncompleteSpirits(value.flow)) &&
    validFlow(value.flow) &&
    Array.isArray(value.stack) &&
    isRecord(value.creation) &&
    isInteger(value.creation.activeSpiritIndex) &&
    Array.isArray(value.creation.spiritCategories) &&
    value.creation.spiritCategories.length === 4
  )
}

export function validateRun(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, reason: '当前人生不是对象' }
  if (value.version !== RUN_VERSION) return { ok: false, reason: '当前人生版本不受支持' }
  if (
    typeof value.id !== 'string' ||
    !isInteger(value.seed) ||
    !isInteger(value.rngCursor) ||
    value.rngCursor < 0 ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return { ok: false, reason: '当前人生基础字段无效' }
  }
  // Legacy saves without pack metadata resume as "base"
  if (typeof value.packId !== 'string' || value.packId.length === 0) {
    value.packId = 'base'
  }
  if (typeof value.packVersion !== 'string' || value.packVersion.length === 0) {
    value.packVersion = '0.0.0'
  }
  if (!validCharacter(value.character, allowsIncompleteSpirits(value.flow))) {
    return { ok: false, reason: '角色数据无效' }
  }
  if (!validFlow(value.flow)) {
    return { ok: false, reason: '流程数据无效' }
  }
  if (!Array.isArray(value.stack) || !Array.isArray(value.history)) {
    return { ok: false, reason: '活动栈或历史无效' }
  }
  if (
    !isRecord(value.creation) ||
    !isInteger(value.creation.activeSpiritIndex) ||
    !Array.isArray(value.creation.spiritCategories) ||
    value.creation.spiritCategories.length !== 4
  ) {
    return { ok: false, reason: '角色创建进度无效' }
  }

  const flow = value.flow as RewriteRun['flow']
  const pending = value.pending
  if (flow.status === 'animating' || flow.status === 'result-pending') {
    if (!isRecord(pending) || pending.kind !== 'wheel') {
      return { ok: false, reason: '转盘状态缺少待确认结果' }
    }
  } else if (flow.status === 'choice-pending') {
    if (!isRecord(pending) || pending.kind !== 'event-choice') {
      return { ok: false, reason: '选择状态缺少事件选项' }
    }
  } else if (pending !== null) {
    return { ok: false, reason: '当前流程不应持有待确认结果' }
  }

  if (value.snapshot !== null && !isValidSnapshot(value.snapshot)) {
    return { ok: false, reason: '最近有效快照无效' }
  }

  const run = value as RewriteRun
  const rawChar = run.character as Record<string, unknown>
  const activeBones = (rawChar.bones && Object.values(rawChar.bones).some(Boolean))
    ? rawChar.bones
    : rawChar[['soul', 'Bones'].join('')] ?? rawChar.bones
  run.character = normalizeCharacter({
    ...(run.character as RewriteCharacter),
    maxLevel: isInteger(run.character.maxLevel)
      ? run.character.maxLevel
      : DEFAULT_MAX_LEVEL,
    bones: normalizeBones(activeBones as any),
  })

  return { ok: true, run }
}
