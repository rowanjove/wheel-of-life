import {
  rewriteEvents,
  type RewriteEffect,
  type RewriteEventContent,
  type RewriteSchoolContent,
} from '../content/adapters'
import type { WheelOption } from './creation'
import type { Flow, RewriteRun } from './model'
import {
  queueHeroInteractionIfNeeded,
} from './heroInteraction'
import { ABSOLUTE_MAX_LEVEL, applyLevelChange } from './progression'
import { queueMissingRingActivities } from './rings'
import { createSeededRng } from './rng'
import {
  advanceMentorYearFlags,
  bonusEventCount,
  currentSchoolAnnualBonus,
  schoolWheelCandidates,
} from './schoolSelection'
import { resolveDeferredFlags } from './flagEffects'
import { resolveBoneRollFlags } from './bones'
import { talentEventLevelBonus } from './talents'

function schoolTier(run: RewriteRun): 'primary' | 'middle' | 'high' {
  if (run.flow.phase === 'primary-school') return 'primary'
  if (run.flow.phase === 'middle-school') return 'middle'
  if (run.flow.phase === 'high-school') return 'high'
  throw new Error('当前不在学校阶段')
}

export function schoolWheelOptions(
  run: RewriteRun,
): WheelOption<RewriteSchoolContent>[] {
  return schoolWheelCandidates(run).map((school, index) => ({
    id: school.id,
    name: school.name,
    description: `${school.location} · ${school.feature}${
      school.minimumLevel ? `（需${school.minimumLevel}级）` : ''
    }`,
    weight: Math.max(0.01, school.selectionWeight),
    color: ['#9fd8f7', '#f2cfe0', '#cfc8ef', '#d9bb78'][index % 4],
    value: school,
  }))
}

export function yearWheelOptions(): WheelOption<number>[] {
  return [
    { id: 'year-growth-1', name: '静修之年', description: '稳固根基。', weight: 25, color: '#d9edf8', value: 1 },
    { id: 'year-growth-2', name: '稳步精进', description: '修炼渐入佳境。', weight: 25, color: '#b9dff5', value: 2 },
    { id: 'year-growth-3', name: '灵光涌现', description: '一次重要顿悟。', weight: 25, color: '#cfc8ef', value: 3 },
    { id: 'year-growth-4', name: '突飞猛进', description: '灵力快速成长。', weight: 25, color: '#f2cfe0', value: 4 },
  ]
}

function eventStage(run: RewriteRun): RewriteEventContent['stage'] {
  if (run.flow.phase === 'primary-school') return 'primary'
  if (run.flow.phase === 'middle-school') return 'middle'
  if (run.flow.phase === 'high-school') return 'high'
  if (run.flow.phase === 'adult') return 'adult'
  return 'common'
}

export function eventWheelOptions(
  run: RewriteRun,
): WheelOption<RewriteEventContent>[] {
  const flags = new Set(run.character.flags)
  const stage = eventStage(run)
  let pool = rewriteEvents.filter((event) =>
    (event.stage === stage || event.stage === 'common') &&
    event.requiredFlags.every((flag) => flags.has(flag)) &&
    event.forbiddenFlags.every((flag) => !flags.has(flag)),
  )
  if (pool.length === 0) {
    const fallback = rewriteEvents.find((event) => event.id === 'common-mysterious-dream')
    pool = fallback ? [fallback] : rewriteEvents.filter((event) => event.stage === 'common').slice(0, 1)
  }
  return pool.map((event, index) => ({
    id: event.id,
    name: event.name,
    description: event.description,
    weight: event.weight,
    color: ['#9fd8f7', '#f2cfe0', '#cfc8ef', '#d9bb78'][index % 4],
    value: event,
  }))
}

export function activityWheelOptions(run: RewriteRun): WheelOption[] {
  if (run.flow.step === 'school-selection') return schoolWheelOptions(run)
  if (/^year-\d+$/.test(run.flow.step)) return yearWheelOptions()
  if (run.flow.step === 'special-event') return eventWheelOptions(run)
  throw new Error('当前活动没有转盘')
}

export function schoolEntryStep(run: RewriteRun): Flow['step'] {
  const tier = schoolTier(run)
  const { level } = run.character
  if (tier === 'middle' && level >= 40) return 'early-contest-offer'
  if (tier === 'high' && level >= 60) return 'early-contest-offer'
  return 'year-1'
}

export function confirmSchool(
  run: RewriteRun,
  school: RewriteSchoolContent,
): RewriteRun {
  return {
    ...run,
    character: {
      ...run.character,
      schoolRecords: [
        ...run.character.schoolRecords,
        {
          tier: school.tier,
          schoolId: school.id,
          schoolName: school.name,
          startYear: run.character.currentYear,
          endYear: null,
        },
      ],
    },
    flow: { phase: run.flow.phase, step: schoolEntryStep(run), status: 'ready' },
    pending: null,
  }
}

export function closeLatestSchoolRecord(run: RewriteRun): RewriteRun {
  const records = run.character.schoolRecords
  const latest = records.at(-1)
  if (!latest || latest.endYear !== null) return run
  return {
    ...run,
    character: {
      ...run.character,
      schoolRecords: [
        ...records.slice(0, -1),
        { ...latest, endYear: run.character.currentYear },
      ],
    },
  }
}

const stageDurations = { primary: 6, middle: 6, high: 5 }

const schoolEventCountProfiles = {
  primary: {
    counts: [0, 1, 2, 3, 4, 5],
    weights: [10, 25, 30, 20, 10, 5],
    yearsLabel: '六',
  },
  middle: {
    counts: [0, 1, 2, 3, 4, 5, 6],
    weights: [8, 20, 28, 24, 13, 6, 1],
    yearsLabel: '六',
  },
  high: {
    counts: [0, 1, 2, 3, 4, 5, 6],
    weights: [5, 18, 25, 25, 17, 8, 2],
    yearsLabel: '五',
  },
} as const

export function schoolEventCountOptions(
  run: RewriteRun,
): WheelOption<number>[] {
  const tier = schoolTier(run)
  const profile = schoolEventCountProfiles[tier]
  return profile.counts.map((count, index) => ({
    id: `school-events-${count}`,
    name: count === 0 ? '平淡岁月' : `${count}次际遇`,
    description: count === 0
      ? `这${profile.yearsLabel}年平淡度过，并无格外际遇。`
      : `毕业前还将经历 ${count} 次命运事件。`,
    weight: profile.weights[index],
    color: ['#d9edf8', '#b9dff5', '#f2cfe0', '#cfc8ef', '#d9bb78', '#9fd8f7'][index % 6],
    value: count,
  }))
}

export function confirmSchoolEventCount(
  run: RewriteRun,
  count: number,
): RewriteRun {
  const totalEvents = count + bonusEventCount(run.character.flags)
  const returnTo: Flow = {
    phase: run.flow.phase,
    step: 'stage-summary',
    status: 'ready',
  }
  if (totalEvents <= 0) {
    return { ...run, flow: returnTo, pending: null }
  }
  const phase = run.flow.phase
  const eventFlows: Flow[] = Array.from({ length: totalEvents }, () => ({
    phase,
    step: 'special-event',
    status: 'ready',
  }))
  const [first, ...queue] = eventFlows
  return {
    ...run,
    flow: first,
    stack: [
      ...run.stack,
      {
        returnTo,
        queue,
        context: { kind: 'event-count', tier: schoolTier(run) },
      },
    ],
    pending: null,
  }
}

function queueSchoolInstantEvent(
  run: RewriteRun,
  returnTo: Flow,
): RewriteRun {
  return {
    ...run,
    flow: { phase: run.flow.phase, step: 'special-event', status: 'ready' },
    stack: [
      ...run.stack,
      { returnTo, queue: [], context: { kind: 'school-instant-event' } },
    ],
    pending: null,
  }
}

export function confirmYear(run: RewriteRun, growth: number): RewriteRun {
  const tier = schoolTier(run)
  const yearIndex = Number(run.flow.step.replace('year-', ''))
  const currentYear = run.character.currentYear + 1
  const schoolBonus = Math.round(currentSchoolAnnualBonus(run) * 0.4)
  const mentor = advanceMentorYearFlags(run.character.flags)
  const rng = createSeededRng(run.seed, run.rngCursor)
  const grown = applyLevelChange(
    {
      ...run.character,
      currentYear,
      flags: mentor.flags,
    },
    growth * run.character.growthMultiplier + schoolBonus + mentor.bonus,
  )
  const nextFlow: Flow = yearIndex >= stageDurations[tier]
    ? { phase: run.flow.phase, step: 'event-count', status: 'ready' }
    : { phase: run.flow.phase, step: `year-${yearIndex + 1}`, status: 'ready' }
  let next = queueMissingRingActivities(
    { ...run, character: grown, rngCursor: rng.cursor(), pending: null },
    nextFlow,
  )
  const instantChance = run.character.talentId === 'peaceful-mind' ? 0.16 : 0.2
  if (rng.next() < instantChance) {
    next = queueSchoolInstantEvent(next, next.flow)
  }
  return next
}

function applyEffect(
  run: RewriteRun,
  effect: RewriteEffect,
): RewriteRun {
  const character = run.character
  switch (effect.type) {
    case 'level':
      return { ...run, character: applyLevelChange(character, effect.amount) }
    case 'max-level':
      return {
        ...run,
        character: {
          ...character,
          maxLevel: Math.min(
            ABSOLUTE_MAX_LEVEL,
            (character.maxLevel ?? 100) + effect.amount,
          ),
        },
      }
    case 'growth-multiplier':
      return {
        ...run,
        character: {
          ...character,
          growthMultiplier: Math.max(0, character.growthMultiplier + effect.amount),
        },
      }
    case 'title':
      return { ...run, character: { ...character, titles: [...new Set([...character.titles, effect.id])] } }
    case 'flag':
      return { ...run, character: { ...character, flags: [...new Set([...character.flags, effect.id])] } }
    case 'item':
      return { ...run, character: { ...character, items: [...new Set([...character.items, effect.id])] } }
    case 'knowledge':
      return { ...run, character: { ...character, knowledge: [...new Set([...character.knowledge, effect.id])] } }
    case 'partner':
      return { ...run, character: { ...character, partner: effect.name } }
    case 'relationship':
      return {
        ...run,
        character: {
          ...character,
          relationships: {
            ...character.relationships,
            [effect.faction]: character.relationships[
              effect.faction as keyof typeof character.relationships
            ] + effect.amount,
          },
        },
      }
    case 'composite':
      return effect.effects.reduce(applyEffect, run)
    case 'hero-unlock':
      return {
        ...run,
        character: {
          ...character,
          flags: [...new Set([...character.flags, 'hero-interaction-pending'])],
        },
      }
    case 'queue-activity':
      return run
  }
}

function resumeActivity(run: RewriteRun): RewriteRun {
  const frame = run.stack.at(-1)
  if (!frame) throw new Error('事件活动缺少返回流程')
  const [next, ...remaining] = frame.queue
  return {
    ...run,
    flow: next ?? frame.returnTo,
    stack: next
      ? [...run.stack.slice(0, -1), { ...frame, queue: remaining }]
      : run.stack.slice(0, -1),
    pending: null,
  }
}

export function confirmEvent(
  run: RewriteRun,
  event: RewriteEventContent,
): RewriteRun {
  if (event.choices.length > 0) {
    return {
      ...run,
      flow: { phase: run.flow.phase, step: 'event-choice', status: 'choice-pending' },
      pending: {
        kind: 'event-choice',
        id: run.pending?.id ?? `choice-${event.id}`,
        title: event.name,
        description: event.description,
        choices: event.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          description: choice.description,
        })),
        payload: { eventId: event.id },
      },
    }
  }
  const applied = event.effects.reduce(applyEffect, { ...run, pending: null })
  const bonus = talentEventLevelBonus(applied.character.talentId)
  const withBonus = bonus > 0
    ? { ...applied, character: applyLevelChange(applied.character, bonus) }
    : applied
  return resolveDeferredFlags(resolveBoneRollFlags(
    queueHeroInteractionIfNeeded(resumeActivity(withBonus)),
  ))
}

export function chooseEvent(run: RewriteRun, choiceId: string): RewriteRun {
  if (run.pending?.kind !== 'event-choice') throw new Error('当前没有事件选择')
  const payload = run.pending.payload as { eventId: string }
  const event = rewriteEvents.find((candidate) => candidate.id === payload.eventId)
  const choice = event?.choices.find((candidate) => candidate.id === choiceId)
  if (!event || !choice) throw new Error('找不到事件选项')
  const applied = choice.effects.reduce(applyEffect, { ...run, pending: null })
  const bonus = talentEventLevelBonus(applied.character.talentId)
  const withBonus = bonus > 0
    ? { ...applied, character: applyLevelChange(applied.character, bonus) }
    : applied
  return resolveDeferredFlags(resolveBoneRollFlags(
    queueHeroInteractionIfNeeded(resumeActivity(withBonus)),
  ))
}

