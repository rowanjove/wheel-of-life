import { getNarrativeContent } from '../../content/activePack'
import { rewriteEndings } from '../content/adapters'
import type { WheelOption } from './creation'
import {
  applyContestPlacement,
  CONTEST_ROUNDS,
  contestPlacementLevelBonus,
  nextContestStep,
  placementOnElimination,
  placementOnFinalAdvance,
  recordContestEntry,
  type ContestRound,
} from './contest'
import {
  contestAdvances,
  type ContestDetailOutcome,
} from './heroInteraction'
import { applyLevelChange, normalizeLevel } from './progression'
import { createSeededRng } from './rng'
import { bonusEventCount } from './schoolSelection'
import {
  emptyBones,
  type BoneSlot,
  tryRollBone,
} from './bones'
import type { Flow, RewriteRun } from './model'

export type ContestOutcome = ContestDetailOutcome
export function earlyContestOfferOptions(): WheelOption<boolean>[] {
  const late = getNarrativeContent().lateGame
  return [
    {
      id: 'early-contest-yes',
      name: late.earlyContestYes.name,
      description: late.earlyContestYes.description,
      weight: late.earlyContestYes.weight,
      color: late.earlyContestYes.color,
      value: true,
    },
    {
      id: 'early-contest-no',
      name: late.earlyContestNo.name,
      description: late.earlyContestNo.description,
      weight: late.earlyContestNo.weight,
      color: late.earlyContestNo.color,
      value: false,
    },
  ]
}

export function confirmEarlyContestOffer(
  run: RewriteRun,
  enroll: boolean,
): RewriteRun {
  const returnTo: Flow = {
    phase: run.flow.phase,
    step: 'year-1',
    status: 'ready',
  }
  if (!enroll) {
    return { ...run, flow: returnTo, pending: null }
  }
  return {
    ...run,
    character: recordContestEntry({
      ...run.character,
      flags: [...new Set([...run.character.flags, 'early-contest-enrolled'])],
    }),
    flow: { phase: 'contest', step: 'qualifier', status: 'ready' },
    stack: [
      ...run.stack,
      { returnTo, queue: [], context: { kind: 'early-contest' } },
    ],
    pending: null,
  }
}

export function ascensionOfferOptions(): WheelOption<boolean>[] {
  const late = getNarrativeContent().lateGame
  return [
    {
      id: 'ascension-yes',
      name: late.ascensionYes.name,
      description: late.ascensionYes.description,
      weight: late.ascensionYes.weight,
      color: late.ascensionYes.color,
      value: true,
    },
    {
      id: 'ascension-no',
      name: late.ascensionNo.name,
      description: late.ascensionNo.description,
      weight: late.ascensionNo.weight,
      color: late.ascensionNo.color,
      value: false,
    },
  ]
}

export function confirmAscensionOffer(
  run: RewriteRun,
  ascend: boolean,
): RewriteRun {
  return {
    ...run,
    character: {
      ...run.character,
      flags: [
        ...new Set([
          ...run.character.flags,
          'ascension-resolved',
          ...(ascend ? ['ascended'] : []),
        ]),
      ],
    },
    flow: { phase: 'adult', step: 'ending-check', status: 'ready' },
    pending: null,
  }
}

export function needsAscensionChoice(run: RewriteRun): boolean {
  const { character } = run
  if (character.level < 100) return false
  if (character.flags.includes('ascension-resolved')) return false
  return character.flags.includes('ascension-choice')
    || character.talentId === 'divine-protection'
}

const BEAST_START_BONES: Array<{ slot: BoneSlot; name: string }> = [
  { slot: 'head', name: '兽王头骨' },
  { slot: 'torso', name: '兽王躯干骨' },
  { slot: 'wing', name: '兽王翅骨' },
]

function bootstrapBeastCharacter(
  character: RewriteRun['character'],
): RewriteRun['character'] {
  const bones = emptyBones()
  for (const bone of BEAST_START_BONES) {
    bones[bone.slot] = {
      id: `beast-born-${bone.slot}`,
      slot: bone.slot,
      quality: 'legendary',
      name: bone.name,
      source: '太古本命灵骨',
    }
  }
  return {
    ...character,
    level: 80,
    maxLevel: 120,
    innatePower: 10,
    growthMultiplier: 1.2,
    bones,
    flags: [...new Set([...character.flags, 'beast-born', 'soul-beast-born'])],
  }
}

export function startContest(run: RewriteRun): RewriteRun {
  return {
    ...run,
    character: recordContestEntry(run.character),
    flow: { phase: 'contest', step: 'qualifier', status: 'ready' },
    pending: null,
  }
}

function contestReputationBonus(outcome: ContestDetailOutcome): number {
  if (outcome === 'crush-win') return 4
  if (outcome === 'win' || outcome === 'narrow-win') return 3
  if (outcome === 'draw') return 2
  return 1
}

function contestLevelBonus(outcome: ContestDetailOutcome): number {
  if (outcome === 'crush-win') return 3
  if (outcome === 'win') return 2
  if (outcome === 'narrow-win') return 1
  if (outcome === 'draw') return 1
  if (outcome === 'narrow-loss') return -2
  return -5
}

export function confirmContestRound(
  run: RewriteRun,
  outcome: ContestOutcome,
): RewriteRun {
  const round = run.flow.step as ContestRound
  if (!CONTEST_ROUNDS.includes(round)) throw new Error('当前不在大赛轮次')

  const advances = contestAdvances(outcome)
  const earlyFrame = run.stack.at(-1)
  const earlyContest = earlyFrame?.context.kind === 'early-contest'
  const nextFlow: Flow = advances
    ? { phase: 'contest', step: nextContestStep(round), status: 'ready' }
    : earlyContest && earlyFrame
      ? earlyFrame.returnTo
      : { phase: 'adult', step: 'event-count', status: 'ready' }

  let character = applyLevelChange(
    run.character,
    contestLevelBonus(outcome),
    'contest',
  )
  character = {
    ...character,
    relationships: {
      ...character.relationships,
      reputation: character.relationships.reputation + contestReputationBonus(outcome),
    },
    flags: [
      ...new Set([
        ...character.flags,
        `contest-${round}-${outcome}`,
      ]),
    ],
  }

  if (!advances) {
    const rank = placementOnElimination(round)
    character = applyContestPlacement(
      character,
      rank,
      contestPlacementLevelBonus(rank),
    )
  } else if (round === 'final') {
    const rank = placementOnFinalAdvance(outcome)
    character = applyContestPlacement(
      character,
      rank,
      contestPlacementLevelBonus(rank),
    )
  }

  let next: RewriteRun = {
    ...run,
    character,
    flow: nextFlow,
    stack: !advances && earlyContest ? run.stack.slice(0, -1) : run.stack,
    pending: null,
  }

  if (round === 'final' && advances && (outcome === 'crush-win' || outcome === 'win')) {
    next = tryRollBone(next, {
      quality: 'rare',
      chance: 60,
      source: '精英联赛冠军',
    })
  }

  return next
}

export function adultEventCountOptions(): WheelOption<number>[] {
  const counts = [0, 1, 2, 3, 4, 5, 6, 7]
  const weights = [5, 15, 22, 22, 18, 12, 5, 1]
  return counts.map((count, index) => ({
    id: `adult-events-${count}`,
    name: count === 0 ? '平静五年' : count === 7 ? '天命之年' : `${count}次际遇`,
    description: count === 0
      ? '未来五年风平浪静。'
      : `未来五年间经历 ${count} 次命运事件。`,
    weight: weights[index],
    color: ['#d9edf8', '#b9dff5', '#f2cfe0', '#cfc8ef', '#d9bb78'][index % 5],
    value: count,
  }))
}

export function adultYearOptions(): WheelOption<number>[] {
  return [
    { id: 'adult-growth-1', name: '静心沉淀', description: '灵力稳步增长。', weight: 20, color: '#d9edf8', value: 1 },
    { id: 'adult-growth-2', name: '游历悟道', description: '在大陆行走中有所领悟。', weight: 30, color: '#b9dff5', value: 2 },
    { id: 'adult-growth-3', name: '突破瓶颈', description: '修炼跨过新的门槛。', weight: 30, color: '#cfc8ef', value: 3 },
    { id: 'adult-growth-4', name: '机缘降临', description: '灵力迎来一次跃升。', weight: 20, color: '#f2cfe0', value: 4 },
  ]
}

export function confirmAdultEventCount(
  run: RewriteRun,
  count: number,
): RewriteRun {
  const totalEvents = count + bonusEventCount(run.character.flags)
  return {
    ...run,
    flow: { phase: 'adult', step: 'year-1', status: 'ready' },
    pending: null,
    stack: [
      ...run.stack,
      {
        returnTo: { phase: 'adult', step: 'ending-check', status: 'ready' },
        queue: [],
        context: { kind: 'adult-cycle', remainingEvents: totalEvents },
      },
    ],
  }
}

export function shouldEndAdultLife(run: RewriteRun): boolean {
  const { character } = run
  const age = character.currentYear - character.birthYear
  const lifespan = character.level >= 90
    ? 120
    : character.level >= 70
      ? 100
      : character.level >= 50
        ? 85
        : 70
  return character.level >= 100
    || age >= lifespan
    || character.flags.includes('lifespan-ending')
}

export function finishAdultYearCycle(run: RewriteRun): RewriteRun {
  const frame = run.stack.at(-1)
  const remainingEvents = Number(frame?.context.remainingEvents ?? 0)
  const returnTo: Flow = { phase: 'adult', step: 'ending-check', status: 'ready' }
  const baseStack = frame ? run.stack.slice(0, -1) : run.stack

  if (remainingEvents <= 0) {
    return { ...run, flow: returnTo, stack: baseStack, pending: null }
  }

  const eventFlows: Flow[] = Array.from({ length: remainingEvents }, () => ({
    phase: 'adult',
    step: 'special-event',
    status: 'ready',
  }))
  const [first, ...queue] = eventFlows
  return {
    ...run,
    flow: first,
    stack: [...baseStack, { returnTo, queue, context: { kind: 'adult-cycle' } }],
    pending: null,
  }
}

function queueAdultInstantEvent(
  run: RewriteRun,
  returnTo: Flow,
): RewriteRun {
  return {
    ...run,
    flow: { phase: 'adult', step: 'special-event', status: 'ready' },
    stack: [...run.stack, { returnTo, queue: [], context: { kind: 'adult-instant-event' } }],
    pending: null,
  }
}

export function confirmAdultYear(
  run: RewriteRun,
  growth: number,
): RewriteRun {
  const yearIndex = Number(run.flow.step.replace('year-', ''))
  if (!Number.isInteger(yearIndex) || yearIndex < 1 || yearIndex > 5) {
    throw new Error('当前不在成年年份轮次')
  }
  const rng = createSeededRng(run.seed, run.rngCursor)
  const character = applyLevelChange(
    { ...run.character, currentYear: run.character.currentYear + 1 },
    growth * run.character.growthMultiplier,
  )
  const cursor = rng.cursor()
  const afterGrowth: RewriteRun = { ...run, character, rngCursor: cursor, pending: null }

  const nextStep: Flow = yearIndex === 5
    ? { phase: 'adult', step: 'adult-cycle-end', status: 'ready' }
    : { phase: 'adult', step: `year-${yearIndex + 1}`, status: 'ready' }

  if (rng.next() < 0.1) {
    return queueAdultInstantEvent(afterGrowth, nextStep)
  }

  if (yearIndex === 5) {
    return finishAdultYearCycle(afterGrowth)
  }

  return { ...afterGrowth, flow: nextStep }
}

export function continueAdultCycleEnd(run: RewriteRun): RewriteRun {
  return finishAdultYearCycle(run)
}

export function continueAdultEndingCheck(run: RewriteRun): RewriteRun {
  if (shouldEndAdultLife(run)) {
    return run
  }
  return {
    ...run,
    flow: { phase: 'adult', step: 'event-count', status: 'ready' },
    pending: null,
  }
}

export function beastCultivationOptions(): WheelOption<number>[] {
  return [
    { id: 'beast-cultivation-1000', name: '千年潜修', description: '避世修炼一千年。', weight: 55, color: '#cfc8ef', value: 1000 },
    { id: 'beast-cultivation-10000', name: '万年沉眠', description: '以漫长岁月积蓄力量。', weight: 30, color: '#9fb3d1', value: 10000 },
    { id: 'beast-cultivation-transform', name: '化形入世', description: '化作人形进入人类世界。', weight: 15, color: '#f2cfe0', value: 1 },
  ]
}

export function confirmBeastRace(run: RewriteRun): RewriteRun {
  return {
    ...run,
    character: bootstrapBeastCharacter({
      ...run.character,
      race: 'soul-beast',
      raceName: '太古神兽',
      schoolRecords: [],
    }),
    flow: { phase: 'soul-beast', step: 'cultivation-year-1', status: 'ready' },
    pending: null,
  }
}

export function confirmBeastCultivation(
  run: RewriteRun,
  years: number,
): RewriteRun {
  if (years === 1) {
    return {
      ...run,
      character: {
        ...run.character,
        race: 'half-beast',
        raceName: '化形灵兽',
        flags: [...new Set([...run.character.flags, 'beast-transformed', 'soul-beast-transformed'])],
      },
      flow: { phase: 'adult', step: 'event-count', status: 'ready' },
      pending: null,
    }
  }
  return {
    ...run,
    character: {
      ...run.character,
      currentYear: run.character.currentYear + years,
      level: normalizeLevel(
        run.character.level + (years >= 10000 ? 10 : 3),
        run.character.maxLevel ?? 100,
      ),
      flags: [...new Set([...run.character.flags, 'soul-beast-hunted-risk'])],
    },
    flow: { phase: 'soul-beast', step: 'tang-san-conflict', status: 'ready' },
    pending: null,
  }
}

export function determineRewriteEnding(run: RewriteRun): string {
  const { character } = run
  if (character.level >= 100 && character.flags.includes('ascended')) return 'divine-companion'
  if (character.level >= 100) return 'human-god'
  if (character.heroLosses >= 3) return 'gracious-retirement'
  if (character.flags.includes('contest-final-draw')) return 'rival-legend'
  if (character.flags.includes('spirit-hall-fallen')) {
    if (character.flags.includes('joined-spirit-hall')) return 'spirit-hall-remnant'
    if (character.flags.includes('spirit-hall-hatred')) return 'reckoning-day'
  }
  if (character.flags.includes('joined-spirit-hall')) return 'spirit-hall-child'
  if (character.birthPlace.includes('岛') && character.schoolRecords.length === 0) return 'island-hermit'
  if (character.level >= 90) return 'legend-finale'
  if (character.level >= 70) return 'hero-rest'
  if (character.level >= 50) return 'ordinary-life'
  return 'passing-traveler'
}

export function finishLife(
  run: RewriteRun,
  at: string,
  historyId: string,
): RewriteRun {
  const endingId = determineRewriteEnding(run)
  const ending = rewriteEndings.find((candidate) => candidate.id === endingId)
  if (!ending) throw new Error('找不到合法结局')
  return {
    ...run,
    character: { ...run.character, endingId },
    flow: { phase: 'ending', step: 'summary', status: 'completed' },
    pending: null,
    history: [
      ...run.history,
      {
        id: historyId,
        runId: run.id,
        at,
        type: 'ending',
        summary: `${run.character.name || '未命名角色'}抵达结局：${ending.name}`,
      },
    ],
  }
}
