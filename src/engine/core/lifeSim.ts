import type { CharacterState, WorldState } from './model'
import {
  modernActions,
  modernEvents,
  modernOrigins,
  modernTraits,
  type ModernActionDefinition,
  type ModernEventChoice,
  type ModernEventDefinition,
} from '../../worlds/default-modern'
import { evaluateCondition } from '../events/conditions'
import { addMemory } from '../events/memory'
import { popDueEvents, scheduleEvent } from '../events/scheduler'
import { createModernFateCeremonies, spinFateWheel } from '../fate/fateWheel'
import { performAction } from '../actions/actionEngine'
import { resolveEnding, type EndingResult } from '../ending/endingResolver'

export interface SeededRng {
  next(): number
}

export function createSeededRng(seed: number): SeededRng {
  let state = seed | 0
  if (state === 0) state = 123456789
  return {
    next() {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      return (state >>> 0) / 4294967296
    },
  }
}

export interface LifeSimSession {
  character: CharacterState
  world: WorldState
  rng: SeededRng
  seed: number
  decisionCount: number
  wheelCount: number
  isFinished: boolean
  ending?: EndingResult
}

export function initModernLife(seed: number, name = '张明'): LifeSimSession {
  const rng = createSeededRng(seed)

  // Pick random origin
  const originIndex = Math.floor(rng.next() * modernOrigins.length)
  const origin = modernOrigins[originIndex] ?? modernOrigins[0]

  // Pick 1~2 traits
  const traitPool = [...modernTraits]
  const pickedTraits = [...(origin.initialTraits ?? [])]
  const trait1Idx = Math.floor(rng.next() * traitPool.length)
  const trait1 = traitPool[trait1Idx]
  if (trait1 && !pickedTraits.includes(trait1.id)) pickedTraits.push(trait1.id)

  const birthYear = 2000
  const initialStats = {
    health: 85,
    knowledge: 15,
    wealth: 5,
    charisma: 50,
    stress: 5,
    reputation: 0,
    ...(origin.initialStats ?? {}),
  }

  const character: CharacterState = {
    id: `char-${seed}`,
    name,
    gender: rng.next() > 0.5 ? 'male' : 'female',
    age: 0,
    birthYear,
    currentYear: birthYear,
    alive: true,
    stats: initialStats,
    talents: [],
    traits: pickedTraits,
    originId: origin.id,
    factionRelations: {
      corporate: 0,
      academia: 0,
      community: 10,
      ...(origin.initialFactionRelations ?? {}),
    },
    relationships: {
      family: 80,
      ...(origin.initialRelations ?? {}),
    },
    inventory: [],
    milestones: [],
    flags: [...(origin.initialFlags ?? [])],
    memories: [],
    scheduledEvents: [],
    history: [
      {
        age: 0,
        year: birthYear,
        title: `降生于世：${origin.name}`,
        description: origin.description,
        type: 'birth',
      },
    ],
  }

  const world: WorldState = {
    year: birthYear,
    variables: {
      economy: 75,
      inWar: false,
    },
    factions: {},
    activeEvents: ['economic-growth'],
    history: [],
  }

  return {
    character,
    world,
    rng,
    seed,
    decisionCount: 0,
    wheelCount: 0,
    isFinished: false,
  }
}

export function applyEventChoice(
  character: CharacterState,
  choice: ModernEventChoice,
  sourceEventId: string,
): CharacterState {
  const stats = { ...character.stats }

  if (choice.effects.statChanges) {
    for (const [key, val] of Object.entries(choice.effects.statChanges)) {
      stats[key] = (stats[key] ?? 0) + val
    }
  }

  let flags = [...character.flags]
  if (choice.effects.addFlags) {
    flags = [...new Set([...flags, ...choice.effects.addFlags])]
  }
  if (choice.effects.removeFlags) {
    flags = flags.filter((f) => !choice.effects.removeFlags?.includes(f))
  }

  let traits = [...character.traits]
  if (choice.effects.addTraits) {
    traits = [...new Set([...traits, ...choice.effects.addTraits])]
  }

  let updatedChar: CharacterState = {
    ...character,
    stats,
    flags,
    traits,
  }

  if (choice.effects.addMemory) {
    updatedChar = addMemory(
      updatedChar,
      choice.effects.addMemory.type,
      sourceEventId,
      choice.effects.addMemory.tags,
    )
  }

  if (choice.effects.scheduleEventId && choice.effects.scheduleDelay) {
    updatedChar = scheduleEvent(
      updatedChar,
      choice.effects.scheduleEventId,
      choice.effects.scheduleDelay,
      { sourceEventId },
    )
  }

  return updatedChar
}

export interface StepResult {
  session: LifeSimSession
  type: 'event' | 'wheel' | 'action' | 'advance' | 'end'
  event?: ModernEventDefinition
  availableChoices?: ModernEventChoice[]
  action?: ModernActionDefinition
  ceremonyId?: string
}

/**
 * 推进人生到下一阶段或重大事件/转盘节点
 */
export function advanceLifeStep(
  session: LifeSimSession,
  preferredChoiceId?: string,
  preferredActionId?: string,
): StepResult {
  if (session.isFinished) {
    return { session, type: 'end' }
  }

  let { character, world, rng } = session
  const ceremonies = createModernFateCeremonies()

  // 1. 检查死亡/终结条件
  const isDead =
    (character.stats.health ?? 0) <= 0 ||
    character.age >= 95 ||
    (character.age >= 60 && rng.next() < (character.age - 55) * 0.02)

  if (isDead) {
    character = { ...character, alive: false }
    const ending = resolveEnding(character, world)
    return {
      session: {
        ...session,
        character,
        isFinished: true,
        ending,
      },
      type: 'end',
    }
  }

  // 2. 检查重大命运轮盘仪式 (16岁少年转折，35岁中年危机)
  if (character.age >= 16 && character.age <= 18 && !character.flags.includes('done-wheel-adolescent')) {
    const ceremony = ceremonies['fate-adolescent']
    if (ceremony) {
      const { updatedCharacter } = spinFateWheel(ceremony, () => rng.next(), character)
      character = {
        ...updatedCharacter,
        flags: [...updatedCharacter.flags, 'done-wheel-adolescent'],
      }
      return {
        session: {
          ...session,
          character,
          wheelCount: session.wheelCount + 1,
        },
        type: 'wheel',
        ceremonyId: ceremony.id,
      }
    }
  }

  if (character.age >= 35 && character.age <= 40 && !character.flags.includes('done-wheel-crisis')) {
    const ceremony = ceremonies['fate-crisis']
    if (ceremony) {
      const { updatedCharacter } = spinFateWheel(ceremony, () => rng.next(), character)
      character = {
        ...updatedCharacter,
        flags: [...updatedCharacter.flags, 'done-wheel-crisis'],
      }
      return {
        session: {
          ...session,
          character,
          wheelCount: session.wheelCount + 1,
        },
        type: 'wheel',
        ceremonyId: ceremony.id,
      }
    }
  }

  // 3. 检查因果调度器（Scheduled Events）
  const { dueEvents, character: scheduledChar } = popDueEvents(character, world)
  character = scheduledChar
  if (dueEvents.length > 0) {
    const due = dueEvents[0]
    const matchedEvent = modernEvents.find((e) => e.id === due.eventId)
    if (matchedEvent) {
      const choice = matchedEvent.choices[0]
      if (choice) {
        character = applyEventChoice(character, choice, matchedEvent.id)
        character.history.push({
          age: character.age,
          year: character.currentYear,
          title: `因果回响：${matchedEvent.title}`,
          description: choice.text,
          type: 'event',
        })
      }
      return {
        session: {
          ...session,
          character,
          decisionCount: session.decisionCount + 1,
        },
        type: 'event',
        event: matchedEvent,
      }
    }
  }

  // 4. 筛选符合当前年龄与条件的事件
  const eligibleEvents = modernEvents.filter((ev) => {
    if (ev.oncePerRun && character.flags.includes(`seen-${ev.id}`)) return false
    if (character.age < ev.ageRange[0] || character.age > ev.ageRange[1]) return false
    if (ev.conditions && !evaluateCondition(ev.conditions, { character, world })) return false
    return true
  })

  if (eligibleEvents.length > 0 && rng.next() < 0.65) {
    const eventIndex = Math.floor(rng.next() * eligibleEvents.length)
    const event = eligibleEvents[eventIndex]
    const chosenChoice =
      event.choices.find((c) => c.id === preferredChoiceId) ??
      event.choices[Math.floor(rng.next() * event.choices.length)]

    character = applyEventChoice(character, chosenChoice, event.id)
    if (event.oncePerRun) {
      character.flags = [...new Set([...character.flags, `seen-${event.id}`])]
    }
    character.history.push({
      age: character.age,
      year: character.currentYear,
      title: event.title,
      description: chosenChoice.text,
      type: 'event',
    })

    // Advance time naturally (2 years skip for life pacing)
    const timeSkip = 2
    const livingCost = character.age >= 22 ? 5 * timeSkip : 0
    const healthDecay = character.age >= 55 ? 2 : 0
    const stats = {
      ...character.stats,
      wealth: Math.max(0, (character.stats.wealth ?? 0) - livingCost),
      health: Math.max(0, (character.stats.health ?? 0) - healthDecay),
    }
    character = {
      ...character,
      stats,
      age: character.age + timeSkip,
      currentYear: character.currentYear + timeSkip,
    }

    return {
      session: {
        ...session,
        character,
        decisionCount: session.decisionCount + 1,
      },
      type: 'event',
      event,
      availableChoices: event.choices,
    }
  }

  // 5. 若无事件触发，执行主动行动 (Action)
  const availableActions = modernActions.filter((a) => {
    return character.age >= a.minAge && (a.maxAge === undefined || character.age <= a.maxAge)
  })

  if (availableActions.length > 0) {
    const action =
      availableActions.find((a) => a.id === preferredActionId) ??
      availableActions[Math.floor(rng.next() * availableActions.length)]

    try {
      character = performAction(action, character)
    } catch {
      // If action fails due to cost, natural rest
      character.stats.stress = Math.max(0, (character.stats.stress ?? 0) - 5)
    }

    const timeSkip = 2
    const livingCost = character.age >= 22 ? 4 * timeSkip : 0
    const healthDecay = character.age >= 55 ? 2 : 0
    const stats = {
      ...character.stats,
      wealth: Math.max(0, (character.stats.wealth ?? 0) - livingCost),
      health: Math.max(0, (character.stats.health ?? 0) - healthDecay),
    }
    character = {
      ...character,
      stats,
      age: character.age + timeSkip,
      currentYear: character.currentYear + timeSkip,
    }

    return {
      session: {
        ...session,
        character,
        decisionCount: session.decisionCount + 1,
      },
      type: 'action',
      action,
    }
  }

  // Default time progression
  character = {
    ...character,
    age: character.age + 2,
    currentYear: character.currentYear + 2,
  }

  return {
    session: {
      ...session,
      character,
    },
    type: 'advance',
  }
}

/**
 * 完整模拟单局人生直至终章
 */
export function simulateFullLife(seed: number, name = '张明'): LifeSimSession {
  let session = initModernLife(seed, name)
  let steps = 0
  const maxSteps = 100

  while (!session.isFinished && steps < maxSteps) {
    const res = advanceLifeStep(session)
    session = res.session
    steps++
  }

  if (!session.isFinished) {
    session.character.alive = false
    session.ending = resolveEnding(session.character, session.world)
    session.isFinished = true
  }

  return session
}
