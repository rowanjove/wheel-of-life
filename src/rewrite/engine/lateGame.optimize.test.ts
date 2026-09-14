import { describe, expect, it } from 'vitest'
import { closeLatestSchoolRecord, confirmSchool, schoolEntryStep } from './activities'
import { createRun } from './factory'
import { resolveHeroInteraction } from './heroInteraction'
import {
  confirmAscensionOffer,
  confirmContestRound,
  confirmEarlyContestOffer,
  confirmBeastRace,
  determineRewriteEnding,
  needsAscensionChoice,
} from './lateGame'
import { rewriteSchools } from '../content/adapters'

function schoolRun(tier: 'middle' | 'high', level: number) {
  const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
  return {
    ...run,
    character: {
      ...run.character,
      level,
      currentYear: 20,
    },
    flow: {
      phase: tier === 'middle' ? 'middle-school' as const : 'high-school' as const,
      step: 'school-selection',
      status: 'ready' as const,
    },
  }
}

describe('late game optimizations', () => {
  it('offers early contest enrollment for strong students', () => {
    const middle = confirmSchool(schoolRun('middle', 42), rewriteSchools.middle[0])
    const high = confirmSchool(schoolRun('high', 65), rewriteSchools.high[0])

    expect(schoolEntryStep(schoolRun('middle', 42))).toBe('early-contest-offer')
    expect(middle.flow.step).toBe('early-contest-offer')
    expect(high.flow.step).toBe('early-contest-offer')
  })

  it('lands on adult life after winning early contest and tang san draw', () => {
    let run = confirmEarlyContestOffer(schoolRun('middle', 45), true)
    for (let index = 0; index < 6; index += 1) {
      run = confirmContestRound(run, 'win')
    }
    run = confirmContestRound(run, 'win')
    const after = resolveHeroInteraction(run, 'draw')

    expect(after.flow).toEqual({
      phase: 'adult',
      step: 'event-count',
      status: 'ready',
    })
    expect(after.stack).toHaveLength(0)
  })

  it('returns early contest losses back to school life', () => {
    const enrolled = confirmEarlyContestOffer(
      schoolRun('middle', 45),
      true,
    )
    const lost = confirmContestRound(enrolled, 'crush-loss')

    expect(lost.flow.phase).toBe('middle-school')
    expect(lost.flow.step).toBe('year-1')
    expect(lost.stack).toHaveLength(0)
  })

  it('requires an ascension choice at level 100', () => {
    const run = {
      ...createRun(1, '2026-06-20T00:00:00.000Z', 'run-1'),
      character: {
        ...createRun(1, '2026-06-20T00:00:00.000Z', 'run-1').character,
        level: 100,
        flags: ['ascension-choice'],
      },
      flow: { phase: 'adult' as const, step: 'ending-check', status: 'ready' as const },
    }

    expect(needsAscensionChoice(run)).toBe(true)

    const ascended = confirmAscensionOffer(run, true)
    expect(ascended.character.flags).toContain('ascended')
    expect(determineRewriteEnding(ascended)).toBe('divine-companion')
  })

  it('bootstraps beasts with high level and innate bones', () => {
    const next = confirmBeastRace(createRun(9, '2026-06-20T00:00:00.000Z', 'run-1'))

    expect(next.character.level).toBe(80)
    expect(next.character.bones?.head?.quality).toBe('legendary')
    expect(next.character.flags).toContain('beast-born')
  })

  it('branches endings after the spirit hall falls', () => {
    const base = createRun(4, '2026-06-20T00:00:00.000Z', 'run-1')
    const remnant = determineRewriteEnding({
      ...base,
      character: {
        ...base.character,
        level: 72,
        flags: ['spirit-hall-fallen', 'joined-spirit-hall'],
      },
    })
    const reckoning = determineRewriteEnding({
      ...base,
      character: {
        ...base.character,
        level: 68,
        flags: ['spirit-hall-fallen', 'spirit-hall-hatred'],
      },
    })

    expect(remnant).toBe('spirit-hall-remnant')
    expect(reckoning).toBe('reckoning-day')
  })

  it('ends in gracious retirement after three losses to the protagonist', () => {
    const run = createRun(3, '2026-06-20T00:00:00.000Z', 'run-1')
    const ending = determineRewriteEnding({
      ...run,
      character: {
        ...run.character,
        heroLosses: 3,
        level: 75,
      },
    })

    expect(ending).toBe('gracious-retirement')
  })

  it('closes the latest school record at stage summary', () => {
    const run = {
      ...createRun(2, '2026-06-20T00:00:00.000Z', 'run-1'),
      character: {
        ...createRun(2, '2026-06-20T00:00:00.000Z', 'run-1').character,
        currentYear: 18,
        schoolRecords: [{
          tier: 'primary' as const,
          schoolId: 'primary-holy-light',
          schoolName: '圣光初级学院',
          startYear: 12,
          endYear: null,
        }],
      },
    }

    const closed = closeLatestSchoolRecord(run)
    expect(closed.character.schoolRecords[0]?.endYear).toBe(18)
  })
})