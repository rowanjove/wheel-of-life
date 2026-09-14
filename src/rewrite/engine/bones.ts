import type { WheelOption } from './creation'
import type { Flow, RewriteCharacter, RewriteRun } from './model'
import type { ReplayableRng } from './rng'
import { createSeededRng } from './rng'

export type BoneSlot =
  | 'head'
  | 'torso'
  | 'left-arm'
  | 'right-arm'
  | 'left-leg'
  | 'right-leg'
  | 'wing'

export type BoneQuality =
  | 'common'
  | 'refined'
  | 'rare'
  | 'legendary'
  | 'divine'

export type BoneState = {
  id: string
  slot: BoneSlot
  quality: BoneQuality
  name: string
  source: string
}

export type BoneMap = Record<BoneSlot, BoneState | null>

export const BONE_SLOTS: BoneSlot[] = [
  'head',
  'torso',
  'left-arm',
  'right-arm',
  'left-leg',
  'right-leg',
  'wing',
]

export const SLOT_LABELS: Record<BoneSlot, string> = {
  head: '头骨',
  torso: '躯干骨',
  'left-arm': '左臂骨',
  'right-arm': '右臂骨',
  'left-leg': '左腿骨',
  'right-leg': '右腿骨',
  wing: '翅骨',
}

export const QUALITY_LABELS: Record<BoneQuality, string> = {
  common: '普通',
  refined: '精良',
  rare: '罕见',
  legendary: '传世',
  divine: '神级',
}

const BONE_NAMES: Record<BoneQuality, string[]> = {
  common: ['青岩骨', '沉铁骨', '雾影骨'],
  refined: ['玄冰骨', '炎阳骨', '雷鸣骨'],
  rare: ['幽冥翼骨', '龙纹骨', '星辉骨'],
  legendary: ['天青神骨', '修罗骨', '天使神骨'],
  divine: ['海神骨', '修罗神骨', '创世骨'],
}

export function emptyBones(): BoneMap {
  return {
    head: null,
    torso: null,
    'left-arm': null,
    'right-arm': null,
    'left-leg': null,
    'right-leg': null,
    wing: null,
  }
}

export function normalizeBones(
  value: Partial<BoneMap> | undefined,
): BoneMap {
  const base = emptyBones()
  if (!value) return base
  for (const slot of BONE_SLOTS) {
    if (value[slot]) base[slot] = value[slot]
  }
  return base
}

export function bonePowerBonus(character: RewriteCharacter): number {
  return occupiedBoneCount(character) * 200
}

export function occupiedBoneCount(character: RewriteCharacter): number {
  const bones = normalizeBones(character.bones)
  return BONE_SLOTS.filter((slot) => bones[slot] !== null).length
}

function boneChanceBonus(talentId: string | null): number {
  return talentId === 'sensitive-smell' ? 15 : 0
}

function createBone(
  slot: BoneSlot,
  quality: BoneQuality,
  source: string,
  rng: ReplayableRng,
): BoneState {
  const names = BONE_NAMES[quality]
  const name = names[rng.integer(0, names.length - 1)]
  return {
    id: `bone-${slot}-${quality}-${rng.integer(1, 9999)}`,
    slot,
    quality,
    name,
    source,
  }
}

function pickEmptySlot(character: RewriteCharacter, rng: ReplayableRng): BoneSlot | null {
  const bones = normalizeBones(character.bones)
  const empty = BONE_SLOTS.filter((slot) => bones[slot] === null)
  if (empty.length === 0) return null
  return empty[rng.integer(0, empty.length - 1)]
}

function rollChance(percent: number, talentId: string | null, rng: ReplayableRng): boolean {
  const adjusted = Math.min(95, percent + boneChanceBonus(talentId))
  return rng.next() * 100 < adjusted
}

type BoneRollSpec = { quality: BoneQuality; chance: number; source: string }

function parseBoneRollFlag(flag: string): BoneRollSpec | null {
  const match = flag.match(/^roll-(common|refined|rare|legendary|divine)(?:-soul)?-bone-(\d+)$/)
  if (!match) return null
  return {
    quality: match[1] as BoneQuality,
    chance: Number(match[2]),
    source: flag,
  }
}

const SPECIAL_BONE_FLAGS: Record<string, BoneRollSpec> = {
  'rare-bone-auction': { quality: 'rare', chance: 35, source: '灵骨拍卖' },
  'divine-bone-clue': { quality: 'divine', chance: 10, source: '上古古墓' },
  'tiny-bone-chance': { quality: 'rare', chance: 5, source: '灵兽大战' },
}

export function awardBone(
  character: RewriteCharacter,
  quality: BoneQuality,
  source: string,
  rng: ReplayableRng,
): { character: RewriteCharacter; candidate: BoneState | null; slot: BoneSlot | null } {
  const slot = pickEmptySlot(character, rng)
  if (!slot) return { character, candidate: null, slot: null }
  const candidate = createBone(slot, quality, source, rng)
  const bones = normalizeBones(character.bones)
  return {
    character: { ...character, bones: { ...bones, [slot]: candidate } },
    candidate,
    slot,
  }
}

export function replaceBone(
  character: RewriteCharacter,
  slot: BoneSlot,
  candidate: BoneState,
): RewriteCharacter {
  const bones = normalizeBones(character.bones)
  return { ...character, bones: { ...bones, [slot]: candidate } }
}

export function queueBoneChoice(
  run: RewriteRun,
  slot: BoneSlot,
  candidate: BoneState,
  returnTo: Flow,
): RewriteRun {
  return {
    ...run,
    flow: { phase: run.flow.phase, step: 'bone-choice', status: 'ready' },
    stack: [
      ...run.stack,
      {
        returnTo,
        queue: [],
        context: {
          boneSlot: slot,
          boneId: candidate.id,
          boneQuality: candidate.quality,
          boneName: candidate.name,
          boneSource: candidate.source,
        },
      },
    ],
    pending: null,
  }
}

export function boneChoiceOptions(
  run: RewriteRun,
): WheelOption<'keep' | 'replace'>[] {
  const frame = run.stack.at(-1)
  const slot = frame?.context.boneSlot as BoneSlot | undefined
  const candidateName = String(frame?.context.boneName ?? '新灵骨')
  const current = slot ? normalizeBones(run.character.bones)[slot] : null
  return [
    {
      id: 'bone-keep',
      name: '保留旧骨',
      description: current
        ? `继续携带${current.name}。`
        : '维持当前状态。',
      weight: 50,
      color: '#cfc8ef',
      value: 'keep',
    },
    {
      id: 'bone-replace',
      name: '替换灵骨',
      description: `以${candidateName}替换该部位灵骨。`,
      weight: 50,
      color: '#b9dff5',
      value: 'replace',
    },
  ]
}

export function confirmBoneChoice(
  run: RewriteRun,
  choice: 'keep' | 'replace',
): RewriteRun {
  const frame = run.stack.at(-1)
  if (!frame || (run.flow.step !== 'bone-choice' && run.flow.step !== 'soul-bone-choice')) {
    throw new Error('当前不在灵骨抉择')
  }
  const slot = frame.context.boneSlot as BoneSlot
  let character = run.character
  if (choice === 'replace') {
    character = replaceBone(character, slot, {
      id: String(frame.context.boneId),
      slot,
      quality: frame.context.boneQuality as BoneQuality,
      name: String(frame.context.boneName),
      source: String(frame.context.boneSource),
    })
  }
  const resumed: RewriteRun = {
    ...run,
    character,
    flow: frame.returnTo,
    stack: run.stack.slice(0, -1),
    pending: null,
  }
  return resolveBoneRollFlags(resumed)
}

export function tryRollBone(
  run: RewriteRun,
  spec: BoneRollSpec,
): RewriteRun {
  const rng = createSeededRng(run.seed, run.rngCursor)
  if (!rollChance(spec.chance, run.character.talentId, rng)) {
    return { ...run, rngCursor: rng.cursor() }
  }

  const slot = pickEmptySlot(run.character, rng)
  const candidate = slot
    ? createBone(slot, spec.quality, spec.source, rng)
    : null

  if (!slot || !candidate) {
    const bones = normalizeBones(run.character.bones)
    const occupied = BONE_SLOTS.filter((entry) => bones[entry] !== null)
    if (occupied.length === 0) {
      return { ...run, rngCursor: rng.cursor() }
    }
    const conflictSlot = occupied[rng.integer(0, occupied.length - 1)]
    const conflictCandidate = createBone(conflictSlot, spec.quality, spec.source, rng)
    return queueBoneChoice(
      { ...run, rngCursor: rng.cursor() },
      conflictSlot,
      conflictCandidate,
      run.flow,
    )
  }

  const cursor = rng.cursor()
  const character = replaceBone(run.character, slot, candidate)
  return {
    ...run,
    rngCursor: cursor,
    character: {
      ...character,
      flags: [...new Set([...character.flags, `gained-bone-${spec.quality}`])],
    },
  }
}

export function resolveBoneRollFlags(run: RewriteRun): RewriteRun {
  const processed = new Set<string>()
  let next = run
  for (const flag of run.character.flags) {
    if (processed.has(flag)) continue
    const spec = parseBoneRollFlag(flag) ?? SPECIAL_BONE_FLAGS[flag]
    if (!spec) continue
    processed.add(flag)
    next = tryRollBone(next, spec)
    next = {
      ...next,
      character: {
        ...next.character,
        flags: next.character.flags.filter((entry) => entry !== flag),
      },
    }
    if (next.flow.step === 'bone-choice' || next.flow.step === 'soul-bone-choice') {
      break
    }
  }
  return next
}