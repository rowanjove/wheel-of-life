import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import {
  confirmHeroOpportunity,
  contestDetailWeights,
  contestWheelOptionsForRun,
  playerCombatPower,
  queueHeroInteractionIfNeeded,
  resolveHeroInteraction,
} from './heroInteraction'
import {
  applyTalentAcquisition,
  canStartHeroInteraction,
  heroInteractionCooldownYears,
} from './talents'

function matureRun() {
  const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
  return {
    ...run,
    character: {
      ...run.character,
      name: '林云深',
      race: 'human' as const,
      raceName: '人类',
      birthYear: 1,
      currentYear: 21,
      level: 55,
      innatePower: 8,
    },
  }
}

describe('hero interaction runtime', () => {
  it('respects cooldown unless tang san rival talent is owned', () => {
    const character = {
      ...matureRun().character,
      lastHeroInteractionYear: 20,
      currentYear: 23,
    }
    expect(canStartHeroInteraction(character)).toBe(false)
    expect(
      canStartHeroInteraction(
        applyTalentAcquisition(character, 'hero-rival'),
      ),
    ).toBe(true)
    expect(heroInteractionCooldownYears('hero-rival')).toBe(1)
  })

  it('routes a winning interaction into the opportunity wheel', () => {
    const run = {
      ...matureRun(),
      flow: { phase: 'contest' as const, step: 'tang-san', status: 'ready' as const },
    }

    const won = resolveHeroInteraction(run, 'win')

    expect(won.flow.step).toBe('hero-opportunity')
    expect(won.character.heroWins).toBe(1)
    expect(won.character.lastHeroInteractionYear).toBe(21)
  })

  it('applies opportunity rewards and exits contest into adult life', () => {
    const run = {
      ...matureRun(),
      flow: { phase: 'contest' as const, step: 'hero-opportunity', status: 'ready' as const },
      stack: [{
        returnTo: { phase: 'middle-school' as const, step: 'year-1', status: 'ready' as const },
        queue: [],
        context: { kind: 'early-contest' },
      }],
    }

    const rewarded = confirmHeroOpportunity(run, {
      kind: 'level',
      amount: 15,
    })

    expect(rewarded.flow).toEqual({
      phase: 'adult',
      step: 'event-count',
      status: 'ready',
    })
    expect(rewarded.stack).toHaveLength(0)
    expect(rewarded.character.level).toBeGreaterThan(55)
  })

  it('queues hero interaction after hero unlock events', () => {
    const run = {
      ...matureRun(),
      character: {
        ...matureRun().character,
        flags: ['hero-interaction-pending'],
      },
      flow: { phase: 'middle-school' as const, step: 'year-2', status: 'ready' as const },
      stack: [],
    }

    const queued = queueHeroInteractionIfNeeded(run)

    expect(queued.flow.step).toBe('hero-interaction')
    expect(queued.stack).toHaveLength(1)
  })

  it('shifts contest odds based on combat power', () => {
    const weak = contestDetailWeights(
      { ...matureRun().character, level: 25, rings: [] },
      'final',
    )
    const strong = contestDetailWeights(
      {
        ...matureRun().character,
        level: 85,
        rings: [{
          id: 'ring-1',
          index: 1,
          years: 5_000,
          quality: 'purple' as const,
          skillName: '第一命技',
          description: '测试',
        }],
      },
      'final',
    )

    expect(strong.win + strong['crush-win']).toBeGreaterThan(weak.win + weak['crush-win'])
    expect(strong['crush-loss']).toBeLessThan(weak['crush-loss'])

    const strongCharacter = {
      ...matureRun().character,
      level: 85,
      rings: [{
        id: 'ring-1',
        index: 1,
        years: 5_000,
        quality: 'purple' as const,
        skillName: '第一命技',
        description: '测试',
      }],
    }
    const options = contestWheelOptionsForRun({
      ...matureRun(),
      character: strongCharacter,
      flow: { phase: 'contest', step: 'final', status: 'ready' },
    })
    expect(options).toHaveLength(6)
    expect(options.find((option) => option.id === 'contest-win')?.weight).toBe(strong.win)
  })

  it('allows mandated hero interaction during cooldown', () => {
    const run = {
      ...matureRun(),
      character: {
        ...matureRun().character,
        lastHeroInteractionYear: matureRun().character.currentYear,
        heroWins: 1,
      },
      flow: { phase: 'contest' as const, step: 'hero-duel', status: 'ready' as const },
    }

    const after = resolveHeroInteraction(run, 'draw')
    expect(after.flow.phase).toBe('adult')
    expect(after.flow.step).toBe('event-count')
  })

  it('increases combat power with rings and talents', () => {
    const character = {
      ...matureRun().character,
      rings: [{
        id: 'ring-1',
        index: 1,
        years: 500,
        quality: 'purple' as const,
        skillName: '第一命技',
        description: '测试',
      }],
      talentId: 'natural-fighter',
    }
    expect(playerCombatPower(character)).toBeGreaterThan(playerCombatPower({
      ...character,
      rings: [],
      talentId: null,
    }))
  })
})