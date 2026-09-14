import type { CharacterState, StatMap, WorldState } from './model'
import type { WorldPack } from '../../worlds/packTypes'
import { allocateInitialPoints } from '../character/stats'
import { applyTalentToCharacter, drawTalents } from '../character/talents'
import { addTrait } from '../character/traits'
import { evaluateCondition } from '../events/conditions'
import { applyEffects } from '../events/effects'
import { EventLibrary } from '../events/library'
import { EventQueue } from '../events/queue'
import type { EventDefinition, EventOption, ResultBranch } from '../events/schema'
import { resolveNextFate, type FateResolutionResult } from '../fate/fateResolver'
import type { ProbabilityBreakdown } from '../fate/modifiers'
import { createStreakTracker, updateStreakTracker, type StreakTracker } from '../fate/pity'
import type { WheelSnapshot } from '../fate/wheelSnapshot'
import { createSeededRng, type SeededRng } from './lifeSim'

export interface GenericLifeSession {
  pack: WorldPack
  character: CharacterState
  world: WorldState
  library: EventLibrary
  queue: EventQueue
  rng: SeededRng
  seed: number
  turn: number
  isFinished: boolean
  pendingEvent?: EventDefinition
  lastSnapshot?: WheelSnapshot
  lastCandidateBreakdowns?: Record<string, ProbabilityBreakdown>
  streakTracker: StreakTracker
  ending?: { endingId: string; title: string; reason?: string }
}

export interface GenericStepResult {
  session: GenericLifeSession
  fateResult?: FateResolutionResult
  activeEvent?: EventDefinition
  chosenOption?: EventOption
  branchTaken?: ResultBranch
  feedbackText?: string
  isFinished: boolean
}

/**
 * 依据任何 WorldPack 初始化一局全新人生
 */
export function initWorldLife(
  pack: WorldPack,
  seed: number,
  options?: {
    name?: string
    originId?: string
    chosenTalentIds?: string[]
    allocatedStats?: StatMap
  },
): GenericLifeSession {
  const rng = createSeededRng(seed)
  const name = options?.name ?? '命运旅者'

  // 1. 出身选择 (指定或随机)
  const origin = options?.originId
    ? pack.origins.find((o) => o.id === options.originId) ?? pack.origins[0]
    : pack.origins[Math.floor(rng.next() * pack.origins.length)] ?? pack.origins[0]

  // 2. 天赋抽取 (6选3)
  const drawnCandidates = drawTalents(pack.talents, 6, rng.next)
  const pickedTalents = options?.chosenTalentIds
    ? pack.talents.filter((t) => options.chosenTalentIds?.includes(t.id))
    : drawnCandidates.slice(0, 3)

  // 3. 初始属性点分配
  const initialPoints = pack.manifest.initialPoints ?? 20
  const pointsAllocation = options?.allocatedStats
    ? { allocated: options.allocatedStats, remainingPoints: 0 }
    : allocateInitialPoints(initialPoints, pack.stats, 'random', { rng: rng.next })

  const birthYear = 2000
  let character: CharacterState = {
    id: `char-${pack.manifest.id}-${seed}`,
    name,
    gender: rng.next() > 0.5 ? 'male' : 'female',
    age: 0,
    months: 0,
    birthYear,
    currentYear: birthYear,
    alive: true,
    stats: { ...pointsAllocation.allocated, ...(origin?.initialStats ?? {}) },
    status: {},
    talents: [],
    traits: [],
    originId: origin?.id,
    factionRelations: { ...(origin?.initialFactionRelations ?? {}) },
    relationships: { ...(origin?.initialRelations ?? {}) },
    inventory: (origin?.initialItems ?? []).map((itemId) => ({
      id: itemId,
      name: itemId,
      type: 'item',
      quantity: 1,
    })),
    milestones: [],
    flags: [...(origin?.initialFlags ?? [])],
    memories: [],
    scheduledEvents: [],
    history: [
      {
        age: 0,
        year: birthYear,
        title: `降生于【${pack.manifest.name}】`,
        description: `出身：${origin?.name ?? '未知'}。${origin?.description ?? ''}`,
        type: 'birth',
      },
    ],
  }

  // 生效开局天赋
  for (const talent of pickedTalents) {
    character = applyTalentToCharacter(character, talent)
  }

  // 生效出身特质
  if (origin?.initialTraits) {
    for (const traitId of origin.initialTraits) {
      const traitDef = pack.traits.find((t) => t.id === traitId)
      if (traitDef) {
        character = addTrait(character, traitDef)
      } else {
        character = {
          ...character,
          traits: [...new Set([...character.traits, traitId])],
        }
      }
    }
  }

  const world: WorldState = {
    year: birthYear,
    variables: {},
    factions: {},
    activeEvents: [],
    history: [],
  }

  const library = new EventLibrary(pack.events)
  const queue = new EventQueue()

  return {
    pack,
    character,
    world,
    library,
    queue,
    rng,
    seed,
    turn: 0,
    isFinished: false,
    streakTracker: createStreakTracker(),
  }
}

/**
 * 推进一回合人生：
 * - 若有挂起的选项，执行玩家选项并结算分支
 * - 否则通过 FateResolver 抽取下一命运事件
 */
export function stepGenericLife(
  session: GenericLifeSession,
  chosenOptionId?: string,
): GenericStepResult {
  if (session.isFinished) {
    return { session, isFinished: true }
  }

  let curChar = { ...session.character }
  let curWorld = { ...session.world }
  let feedbackText = ''
  let branchTaken: ResultBranch | undefined
  let chosenOption: EventOption | undefined

  // 1. 如果当前正处于等待玩家做选项的事件
  if (session.pendingEvent && session.pendingEvent.options && session.pendingEvent.options.length > 0) {
    const event = session.pendingEvent
    const options = session.pendingEvent.options
    chosenOption =
      options.find((o) => o.id === chosenOptionId) ??
      options[0]

    // 检查结果分支 (ResultBranch)
    if (chosenOption.branches && chosenOption.branches.length > 0) {
      for (const branch of chosenOption.branches) {
        let matched = true
        if (branch.condition) {
          matched = evaluateCondition(branch.condition, { character: curChar, world: curWorld })
        }
        if (matched && branch.check) {
          const statVal = curChar.stats[branch.check.stat] ?? 0
          const roll = session.rng.next() * 20 // 0~20 随机波动
          matched = statVal + roll >= branch.check.difficulty
        }
        if (matched) {
          branchTaken = branch
          break
        }
      }
      if (!branchTaken) {
        branchTaken = chosenOption.branches[chosenOption.branches.length - 1]
      }
    }

    feedbackText = branchTaken?.text ?? chosenOption.text

    // 应用分支效果或选项直接效果
    const effectsToApply = branchTaken?.effects ?? chosenOption.effects ?? []
    const applyRes = applyEffects(curChar, effectsToApply, curWorld)
    const choiceEndingTriggered = applyRes.endingTriggered
    curChar = applyRes.character
    if (applyRes.world) curWorld = applyRes.world
    for (const qe of applyRes.queuedEvents) {
      session.queue.push(qe)
    }

    // 推进月度时间
    const timeCostMonths = event.timeCost ?? 12
    const newMonths = (curChar.months ?? curChar.age * 12) + timeCostMonths
    const newAge = Math.floor(newMonths / 12)
    const yearDelta = newAge - curChar.age
    curChar = {
      ...curChar,
      months: newMonths,
      age: newAge,
      currentYear: curChar.currentYear + yearDelta,
    }

    // 记录大事记
    curChar.history = [
      ...curChar.history,
      {
        age: curChar.age,
        year: curChar.currentYear,
        title: `${event.title}：${chosenOption.text}`,
        description: feedbackText,
        type: 'choice',
        metadata: { eventId: event.id, optionId: chosenOption.id },
      },
    ]

    // 检查生命状态
    const health = curChar.stats.health ?? 80
    if (health <= 0 || !curChar.alive || curChar.age >= 100 || choiceEndingTriggered) {
      curChar.alive = false
      const ending = resolveSessionEnding(session, curChar, curWorld, choiceEndingTriggered)
      return {
        session: {
          ...session,
          character: curChar,
          world: curWorld,
          pendingEvent: undefined,
          isFinished: true,
          ending,
        },
        activeEvent: event,
        chosenOption,
        branchTaken,
        feedbackText,
        isFinished: true,
      }
    }

    // 清除 pendingEvent，准备转动下一次命运
    session = {
      ...session,
      character: curChar,
      world: curWorld,
      pendingEvent: undefined,
    }
  }

  // 2. 通过 FateResolver 转动命运轮盘
  const fate = resolveNextFate(
    session.library,
    session.queue,
    session.character,
    session.world,
    session.rng.next,
    {
      currentMonth: session.character.months ?? session.character.age * 12,
      wheelMode: session.pack.manifest.wheelMode,
      streakTracker: session.streakTracker,
      itemDefinitions: session.pack.items,
    },
  )

  const activeEvent = fate.selectedEvent
  const nextStreakTracker = updateStreakTracker(session.streakTracker, activeEvent.category)

  // 3. 判断是否为即时事件 (Instant Event)
  const isInstant = !activeEvent.options || activeEvent.options.length === 0

  if (isInstant) {
    let nextChar = { ...session.character }
    let instantEndingTriggered: { endingId: string; reason?: string } | undefined
    if (activeEvent.directEffects) {
      const effRes = applyEffects(nextChar, activeEvent.directEffects, session.world)
      nextChar = effRes.character
      instantEndingTriggered = effRes.endingTriggered
      for (const qe of effRes.queuedEvents) {
        session.queue.push(qe)
      }
    }

    // 时间推进
    const timeCost = activeEvent.timeCost ?? 12
    const newMonths = (nextChar.months ?? nextChar.age * 12) + timeCost
    const newAge = Math.floor(newMonths / 12)
    nextChar = {
      ...nextChar,
      months: newMonths,
      age: newAge,
      currentYear: nextChar.currentYear + (newAge - nextChar.age),
    }

    nextChar.history = [
      ...nextChar.history,
      {
        age: nextChar.age,
        year: nextChar.currentYear,
        title: activeEvent.title,
        description: activeEvent.text,
        type: 'event',
        metadata: { eventId: activeEvent.id },
      },
    ]

    const isDead = (nextChar.stats.health ?? 80) <= 0 || !nextChar.alive || nextChar.age >= 100 || !!instantEndingTriggered
    if (isDead) {
      nextChar.alive = false
      const ending = resolveSessionEnding(session, nextChar, session.world, instantEndingTriggered)
      return {
        session: {
          ...session,
          character: nextChar,
          turn: session.turn + 1,
          isFinished: true,
          lastSnapshot: fate.snapshot,
          lastCandidateBreakdowns: fate.candidateBreakdowns,
          streakTracker: nextStreakTracker,
          ending,
        },
        fateResult: fate,
        activeEvent,
        feedbackText: activeEvent.text,
        isFinished: true,
      }
    }

    return {
      session: {
        ...session,
        character: nextChar,
        turn: session.turn + 1,
        lastSnapshot: fate.snapshot,
        lastCandidateBreakdowns: fate.candidateBreakdowns,
        streakTracker: nextStreakTracker,
        pendingEvent: undefined,
      },
      fateResult: fate,
      activeEvent,
      feedbackText: activeEvent.text,
      isFinished: false,
    }
  }

  // 4. 选择类事件 (Choice Event)：挂起等待玩家输入
  return {
    session: {
      ...session,
      turn: session.turn + 1,
      pendingEvent: activeEvent,
      lastSnapshot: fate.snapshot,
      lastCandidateBreakdowns: fate.candidateBreakdowns,
      streakTracker: nextStreakTracker,
    },
    fateResult: fate,
    activeEvent,
    isFinished: false,
  }
}

export function resolveSessionEnding(
  session: GenericLifeSession,
  character: CharacterState,
  world: WorldState,
  explicitEnding?: { endingId: string; reason?: string },
): { endingId: string; title: string; reason: string } {
  // 1. 显式触发的结局
  if (explicitEnding?.endingId) {
    const matched = session.pack.endings.find((e) => e.id === explicitEnding.endingId)
    return {
      endingId: explicitEnding.endingId,
      title: matched?.title ?? '命运终章',
      reason: explicitEnding.reason ?? character.causeOfDeath ?? '命运决断',
    }
  }

  // 2. 匹配 WorldPack 结局定义
  const candidateEndings = session.pack.endings.filter((e) => {
    if (!e.conditions) return false
    return evaluateCondition(e.conditions as any, { character, world })
  })

  if (candidateEndings.length > 0) {
    candidateEndings.sort((a, b) => (b.rarity ?? 0) - (a.rarity ?? 0))
    const best = candidateEndings[0]
    return {
      endingId: best.id,
      title: best.title,
      reason: character.causeOfDeath ?? best.description ?? '达成人生成就',
    }
  }

  // 3. 默认结局兜底（优先使用 pack 中的无条件结局）
  const defaultEnding = session.pack.endings.find((e) => !e.conditions) ?? session.pack.endings[0]
  return {
    endingId: defaultEnding?.id ?? 'natural-end',
    title: defaultEnding?.title ?? '人生终章',
    reason: character.causeOfDeath ?? (character.age >= 80 ? '寿终正寝' : '岁月静止'),
  }
}
