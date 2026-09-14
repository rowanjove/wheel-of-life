import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import { resolveHeroInteraction } from './heroInteraction'
import {
  confirmAdultYear,
  confirmContestRound,
  confirmBeastCultivation,
  confirmBeastRace,
  finishLife,
  startContest,
} from './lateGame'

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
      currentYear: 16,
      level: 52,
    },
  }
}

describe('late game state machine', () => {
  it('persists each exact contest round as its own flow step', () => {
    const registered = startContest(matureRun())
    const qualifierWon = confirmContestRound(registered, 'win')
    const group1Won = confirmContestRound(qualifierWon, 'win')
    const group2Won = confirmContestRound(group1Won, 'win')
    const group3Won = confirmContestRound(group2Won, 'win')
    const quarterfinalWon = confirmContestRound(group3Won, 'win')

    expect(registered.flow).toEqual({
      phase: 'contest',
      step: 'qualifier',
      status: 'ready',
    })
    expect(registered.character.contestAppearances).toBe(1)
    expect(qualifierWon.flow.step).toBe('group-1')
    expect(group1Won.flow.step).toBe('group-2')
    expect(group2Won.flow.step).toBe('group-3')
    expect(group3Won.flow.step).toBe('quarterfinal')
    expect(quarterfinalWon.flow.step).toBe('semifinal')
  })

  it('advances adult growth exactly one year per confirmed wheel', () => {
    const run = {
      ...matureRun(),
      seed: 1000,
      rngCursor: 0,
      flow: { phase: 'adult' as const, step: 'year-1', status: 'result-pending' as const },
    }

    const next = confirmAdultYear(run, 3)

    expect(next.character.currentYear).toBe(run.character.currentYear + 1)
    expect(
      next.flow.step === 'year-2' || next.flow.step === 'special-event',
    ).toBe(true)
  })

  it('sends beasts directly into cultivation without creating a school', () => {
    const next = confirmBeastRace(matureRun())

    expect(next.flow).toEqual({
      phase: 'soul-beast',
      step: 'cultivation-year-1',
      status: 'ready',
    })
    expect(next.character.schoolRecords).toEqual([])
  })

  it('advances from the contest final into adult life after tang san interaction', () => {
    let run = startContest(matureRun())
    for (let index = 0; index < 6; index += 1) {
      run = confirmContestRound(run, 'win')
    }
    const finalWon = confirmContestRound(run, 'win')

    expect(finalWon.flow).toEqual({
      phase: 'contest',
      step: 'tang-san',
      status: 'ready',
    })

    const afterTang = resolveHeroInteraction(finalWon, 'draw')

    expect(afterTang.flow).toEqual({
      phase: 'adult',
      step: 'event-count',
      status: 'ready',
    })
    expect(afterTang.character.flags).toContain('contest-final-draw')
    expect(afterTang.character.titles).toContain('命运对手')
  })

  it('resolves beast cultivation conflicts into adult life', () => {
    const cultivated = confirmBeastCultivation(
      {
        ...confirmBeastRace(matureRun()),
        flow: {
          phase: 'soul-beast',
          step: 'cultivation-year-1',
          status: 'ready',
        },
      },
      1000,
    )

    expect(cultivated.flow.step).toBe('tang-san-conflict')

    const afterTang = resolveHeroInteraction(cultivated, 'loss')

    expect(afterTang.flow).toEqual({
      phase: 'adult',
      step: 'event-count',
      status: 'ready',
    })
    expect(afterTang.character.flags).toContain('hero-loss')
  })

  it('creates a completed ending and a read-only history entry', () => {
    const ended = finishLife(
      {
        ...matureRun(),
        character: { ...matureRun().character, level: 91 },
      },
      '2026-06-20T01:00:00.000Z',
      'ending-1',
    )

    expect(ended.flow).toEqual({
      phase: 'ending',
      step: 'summary',
      status: 'completed',
    })
    expect(ended.character.endingId).toBe('legend-finale')
    expect(ended.history.at(-1)).toMatchObject({
      id: 'ending-1',
      type: 'ending',
      runId: 'run-1',
    })
  })
})
