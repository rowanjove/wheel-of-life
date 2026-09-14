import { formatTemplate, getNarrativeContent } from '../../content/activePack'
import { getLexicon } from '../../content/lexicon'
import type { ContestRound } from './contest'
import { CONTEST_ROUNDS } from './contest'
import type { WheelOption } from './creation'
import type { RewriteCharacter, RewriteRun } from './model'
import { applyLevelChange } from './progression'
import { bonePowerBonus, tryRollBone } from './bones'
import {
  canStartHeroInteraction,
  contestWinWeightBonus,
  heroInteractionCooldownYears,
} from './talents'

export type HeroOutcome = 'win' | 'draw' | 'loss'

export type HeroOpportunity =
  | { kind: 'level'; amount: number }
  | { kind: 'title'; id: string }
  | { kind: 'knowledge'; id: string }
  | { kind: 'reputation'; amount: number }
  | { kind: 'bone'; quality: 'rare' | 'legendary' }

function ringPowerContribution(years: number): number {
  if (years >= 100_000) return 1_000
  if (years >= 1_000) return 100
  if (years >= 100) return 10
  return 1
}

export function playerCombatPower(character: RewriteCharacter): number {
  const ringPower = character.rings.reduce(
    (sum, ring) => sum + ringPowerContribution(ring.years),
    0,
  )
  const titleBonus = character.titles.length * 50
  const talentBonus = character.talentId === 'natural-fighter' ? 80 : 0
  return character.level * 10 + ringPower + titleBonus + talentBonus + bonePowerBonus(character)
}

export function heroCombatPower(year: number): number {
  const bands = getNarrativeContent().hero.powerBands
  for (const band of bands) {
    if (year < band.untilYear) return band.power
  }
  return bands.at(-1)?.power ?? 8_000
}

export function heroOutcomeWeights(
  character: RewriteCharacter,
): Record<HeroOutcome, number> {
  const player = playerCombatPower(character)
  const heroPower = heroCombatPower(character.currentYear)
  const ratio = player / heroPower

  if (ratio >= 1.15) {
    return { win: 62, draw: 18, loss: 20 }
  }
  if (ratio >= 1.02) {
    return { win: 48, draw: 24, loss: 28 }
  }
  if (ratio >= 0.92) {
    return { win: 28, draw: 44, loss: 28 }
  }
  if (ratio >= 0.75) {
    return { win: 18, draw: 22, loss: 60 }
  }
  return { win: 10, draw: 15, loss: 75 }
}

export function heroInteractionWheelOptions(
  run: RewriteRun,
): WheelOption<HeroOutcome>[] {
  const weights = heroOutcomeWeights(run.character)
  const outcomes = getNarrativeContent().hero.outcomes
  return (['win', 'draw', 'loss'] as const).map((outcome) => ({
    id: `hero-${outcome}`,
    name: outcomes[outcome].name,
    description: outcomes[outcome].description,
    weight: weights[outcome],
    color: outcomes[outcome].color,
    value: outcome,
  }))
}

export function heroOpportunityOptions(): WheelOption<HeroOpportunity>[] {
  return getNarrativeContent().hero.opportunities.map((option) => ({
    id: option.id,
    name: option.name,
    description: option.description,
    weight: option.weight,
    color: option.color,
    value: option.value,
  }))
}

function recordHeroInteraction(
  character: RewriteCharacter,
  outcome: HeroOutcome,
): RewriteCharacter {
  return {
    ...character,
    lastHeroInteractionYear: character.currentYear,
    heroWins: character.heroWins + (outcome === 'win' ? 1 : 0),
    heroLosses: character.heroLosses + (outcome === 'loss' ? 1 : 0),
    heroDraws: character.heroDraws + (outcome === 'draw' ? 1 : 0),
    flags: [
      ...new Set([
        ...character.flags,
        `hero-${outcome}`,
      ]),
    ],
  }
}

function applyHeroLoss(character: RewriteCharacter, heroPower: number, player: number): RewriteCharacter {
  const gap = heroPower - player
  const loss = gap > heroPower * 0.25 ? -10 : -5
  return applyLevelChange(character, loss, 'hero')
}

export function resolveHeroInteraction(
  run: RewriteRun,
  outcome: HeroOutcome,
): RewriteRun {
  const isHeroDuel = run.flow.step === 'hero-duel' || run.flow.step === 'tang-san'
  const isHeroConflict = run.flow.step === 'hero-conflict' || run.flow.step === 'tang-san-conflict'

  if (run.flow.step !== 'hero-interaction' && !isHeroDuel && !isHeroConflict) {
    throw new Error('当前不在主角互动')
  }
  const mandatedStory = isHeroDuel || isHeroConflict
  if (!mandatedStory && !canStartHeroInteraction(run.character)) {
    throw new Error('主角互动尚在冷却中')
  }

  const fromContestFinal =
    run.flow.phase === 'contest' && isHeroDuel
  const player = playerCombatPower(run.character)
  const heroPower = heroCombatPower(run.character.currentYear)
  let character = recordHeroInteraction(run.character, outcome)

  if (outcome === 'win') {
    character = applyLevelChange(character, 5, 'hero')
    return {
      ...run,
      character: {
        ...character,
        relationships: {
          ...character.relationships,
          reputation: character.relationships.reputation + 4,
        },
      },
      flow: {
        phase: run.flow.phase,
        step: 'hero-opportunity',
        status: 'ready',
      },
      pending: null,
    }
  }

  if (outcome === 'draw') {
    character = applyLevelChange(character, 3, 'hero')
    const titles = [...new Set([...character.titles, getNarrativeContent().hero.drawTitle])]
    const flags = [
      ...new Set([
        ...character.flags,
        ...(fromContestFinal ? ['contest-final-draw'] : []),
      ]),
    ]
    return finishHeroInteraction({
      ...run,
      character: {
        ...character,
        titles,
        flags,
        relationships: {
          ...character.relationships,
          reputation: character.relationships.reputation + 2,
        },
      },
    })
  }

  character = applyHeroLoss(character, heroPower, player)
  return finishHeroInteraction({ ...run, character })
}

export function confirmHeroOpportunity(
  run: RewriteRun,
  opportunity: HeroOpportunity,
): RewriteRun {
  if (run.flow.step !== 'hero-opportunity') {
    throw new Error('当前不在机缘转盘')
  }

  let character = run.character
  if (opportunity.kind === 'level') {
    character = applyLevelChange(character, opportunity.amount, 'hero')
  } else if (opportunity.kind === 'title') {
    character = {
      ...character,
      titles: [...new Set([...character.titles, opportunity.id])],
    }
  } else if (opportunity.kind === 'knowledge') {
    character = {
      ...character,
      knowledge: [...new Set([...character.knowledge, opportunity.id])],
    }
  } else if (opportunity.kind === 'bone') {
    const rolled = tryRollBone(run, {
      quality: opportunity.quality,
      chance: 100,
      source: getNarrativeContent().hero.boneSource,
    })
    return finishHeroInteraction(rolled)
  } else {
    character = {
      ...character,
      relationships: {
        ...character.relationships,
        reputation: character.relationships.reputation + opportunity.amount,
      },
    }
  }

  return finishHeroInteraction({ ...run, character })
}

function finishContestHeroInteraction(run: RewriteRun): RewriteRun {
  return {
    ...run,
    stack: run.stack.filter((frame) => frame.context.kind !== 'early-contest'),
    flow: { phase: 'adult', step: 'event-count', status: 'ready' },
    pending: null,
  }
}

function finishHeroInteraction(run: RewriteRun): RewriteRun {
  const frame = run.stack.at(-1)
  const exitingContest =
    run.flow.phase === 'contest' || frame?.context.kind === 'early-contest'
  if (exitingContest) {
    return finishContestHeroInteraction(
      frame ? { ...run, stack: run.stack.slice(0, -1) } : run,
    )
  }
  if (frame) {
    return {
      ...run,
      flow: frame.returnTo,
      stack: run.stack.slice(0, -1),
      pending: null,
    }
  }

  return {
    ...run,
    flow: { phase: 'adult', step: 'event-count', status: 'ready' },
    pending: null,
  }
}

export function queueHeroInteractionIfNeeded(run: RewriteRun): RewriteRun {
  if (!run.character.flags.includes('hero-interaction-pending')) return run
  if (!canStartHeroInteraction(run.character)) {
    return {
      ...run,
      character: {
        ...run.character,
        flags: run.character.flags.filter((flag) => flag !== 'hero-interaction-pending'),
      },
    }
  }

  const returnTo = run.flow
  return {
    ...run,
    character: {
      ...run.character,
      flags: run.character.flags.filter((flag) => flag !== 'hero-interaction-pending'),
    },
    flow: { phase: returnTo.phase, step: 'hero-interaction', status: 'ready' },
    stack: [...run.stack, { returnTo, queue: [], context: {} }],
    pending: null,
  }
}

export function yearAdvanceSummary(
  character: RewriteCharacter,
  growth: number,
): string[] {
  const nextYear = character.currentYear + 1
  const age = Math.max(0, nextYear - character.birthYear)
  const templates = getNarrativeContent().yearAdvance
  const lex = getLexicon()
  const growthValue = Math.round(growth * character.growthMultiplier)
  return [
    formatTemplate(templates.calendarLine, {
      calendar: lex.calendarName,
      year: nextYear,
      age,
      growth: growthValue,
      hero: lex.heroName,
    }),
    formatTemplate(templates.ageLine, {
      calendar: lex.calendarName,
      year: nextYear,
      age,
      growth: growthValue,
      hero: lex.heroName,
    }),
    formatTemplate(templates.growthLine, {
      calendar: lex.calendarName,
      year: nextYear,
      age,
      growth: growthValue,
      hero: lex.heroName,
    }),
  ]
}

function contestOpponentPower(round: ContestRound, year: number): number {
  const base: Record<ContestRound, number> = {
    qualifier: 70,
    'group-1': 100,
    'group-2': 115,
    'group-3': 130,
    quarterfinal: 280,
    semifinal: 550,
    final: 1_100,
  }
  return base[round] + year * 3
}

export type ContestDetailOutcome =
  | 'crush-win'
  | 'win'
  | 'narrow-win'
  | 'draw'
  | 'narrow-loss'
  | 'crush-loss'

export function contestDetailWeights(
  character: RewriteCharacter,
  round: ContestRound,
): Record<ContestDetailOutcome, number> {
  const player = playerCombatPower(character)
  const opponent = contestOpponentPower(round, character.currentYear)
  const ratio = player / opponent
  const winBonus = contestWinWeightBonus(character.talentId)

  let weights: Record<ContestDetailOutcome, number>
  if (ratio >= 1.3) {
    weights = { 'crush-win': 32, win: 28, 'narrow-win': 18, draw: 12, 'narrow-loss': 7, 'crush-loss': 3 }
  } else if (ratio >= 1.15) {
    weights = { 'crush-win': 22, win: 26, 'narrow-win': 22, draw: 14, 'narrow-loss': 11, 'crush-loss': 5 }
  } else if (ratio >= 1.02) {
    weights = { 'crush-win': 12, win: 24, 'narrow-win': 24, draw: 18, 'narrow-loss': 14, 'crush-loss': 8 }
  } else if (ratio >= 0.9) {
    weights = { 'crush-win': 6, win: 16, 'narrow-win': 22, draw: 24, 'narrow-loss': 20, 'crush-loss': 12 }
  } else if (ratio >= 0.75) {
    weights = { 'crush-win': 3, win: 10, 'narrow-win': 16, draw: 16, 'narrow-loss': 28, 'crush-loss': 27 }
  } else {
    weights = { 'crush-win': 1, win: 5, 'narrow-win': 10, draw: 12, 'narrow-loss': 30, 'crush-loss': 42 }
  }

  weights.win += winBonus
  weights['crush-win'] += Math.round(winBonus / 2)
  weights['crush-loss'] = Math.max(2, weights['crush-loss'] - Math.round(winBonus / 2))
  weights['narrow-loss'] = Math.max(4, weights['narrow-loss'] - Math.round(winBonus / 3))
  return weights
}

export function contestAdvances(outcome: ContestDetailOutcome): boolean {
  return outcome !== 'narrow-loss' && outcome !== 'crush-loss'
}

export function contestWheelOptionsForRun(
  run: RewriteRun,
): WheelOption<ContestDetailOutcome>[] {
  const round = run.flow.step as ContestRound
  if (!CONTEST_ROUNDS.includes(round)) {
    throw new Error('当前不在大赛轮次')
  }
  const weights = contestDetailWeights(run.character, round)
  const meta = getNarrativeContent().contestOutcomes
  return (Object.keys(meta) as ContestDetailOutcome[]).map((outcome) => ({
    ...meta[outcome],
    weight: weights[outcome],
    value: outcome,
  }))
}

export function heroCooldownLabel(character: RewriteCharacter): string {
  const cooldown = heroInteractionCooldownYears(character.talentId)
  if (character.lastHeroInteractionYear === null) {
    return `主角互动冷却：${cooldown} 年`
  }
  const remaining = cooldown - (character.currentYear - character.lastHeroInteractionYear)
  if (remaining <= 0) return '主角互动：可触发'
  return `主角互动冷却：还需 ${remaining} 年`
}