import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import type { RewriteRun } from './model'
import { reduceRewriteRun, type ReducerDependencies } from './reducer'
import { rewriteEvents } from '../content/adapters'
import { schoolEventCountOptions, schoolWheelOptions } from './activities'

const NOW = '2026-06-20T00:00:00.000Z'

function deps(optionId?: string): ReducerDependencies {
  let id = 0
  return {
    now: () => NOW,
    nextId: () => `result-${++id}`,
    pickOption: (options) =>
      options.find((option) => option.id === optionId) ?? options[0],
  }
}

function confirmWheel(run: RewriteRun, optionId: string) {
  const dependencies = deps(optionId)
  const animating = reduceRewriteRun(run, { type: 'START_WHEEL' }, dependencies)
  const stopped = reduceRewriteRun(animating, { type: 'ANIMATION_FINISHED' }, dependencies)
  return reduceRewriteRun(stopped, { type: 'CONFIRM_RESULT' }, dependencies)
}

function enrolledRun(): RewriteRun {
  const base = createRun(42, NOW, 'run-1')
  return {
    ...base,
    character: {
      ...base.character,
      name: '林云深',
      gender: 'male',
      race: 'human',
      raceName: '人族',
      birthYear: 5,
      currentYear: 11,
      level: 9,
      spiritCount: 1,
      spirits: [{
        id: 'tool-rusty-sword',
        name: '烂铁剑',
        category: 'tool',
        quality: '废',
        evolvedFrom: null,
        fusionIds: [],
      }],
      schoolRecords: [{
        tier: 'primary',
        schoolId: 'primary-holy-light',
        schoolName: '圣光初级学院',
        startYear: 11,
        endYear: null,
      }],
    },
    flow: { phase: 'primary-school', step: 'year-1', status: 'ready' },
  }
}

describe('rewrite schools, years and events', () => {
  it('offers exactly four school candidates', () => {
    const base = createRun(42, NOW, 'run-1')
    const run: RewriteRun = {
      ...base,
      character: { ...base.character, race: 'human', raceName: '人族' },
      flow: { phase: 'primary-school', step: 'school-selection', status: 'ready' },
    }
    expect(schoolWheelOptions(run)).toHaveLength(4)
  })

  it('returns from a ring and choice event to the exact next school year', () => {
    let run = confirmWheel(enrolledRun(), 'year-growth-1')
    expect(run.flow.step).toBe('soul-ring-1')

    run = confirmWheel(run, 'ring-1-white-10-19')
    expect(run.flow.step).toBe('special-event')

    run = confirmWheel(run, 'primary-classmate-secret')
    expect(run.flow.status).toBe('choice-pending')

    run = reduceRewriteRun(
      run,
      { type: 'CHOOSE_EVENT', choiceId: 'report' },
      deps(),
    )
    expect(run.flow).toEqual({
      phase: 'primary-school',
      step: 'year-2',
      status: 'ready',
    })
    expect(run.character.flags).toContain('reported-spirit-hall-contact')
  })

  it('routes the final school year into the event-count wheel', () => {
    const run: RewriteRun = {
      ...enrolledRun(),
      flow: { phase: 'primary-school', step: 'year-6', status: 'ready' },
      character: {
        ...enrolledRun().character,
        currentYear: 16,
        level: 7,
        rings: [{
          id: 'ring-1-10',
          index: 1,
          years: 10,
          quality: 'white',
          skillName: '第1命技',
          description: '10年白色灵环。',
        }],
      },
    }

    const next = confirmWheel(run, 'year-growth-1')

    if (next.flow.step === 'soul-ring-1') {
      expect(next.stack.at(-1)?.returnTo.step).toBe('event-count')
    } else {
      expect(next.flow.step).toBe('event-count')
      expect(schoolEventCountOptions(next)).toHaveLength(6)
    }
  })

  it('queues graduation events before stage summary', () => {
    let run: RewriteRun = {
      ...enrolledRun(),
      flow: { phase: 'primary-school', step: 'event-count', status: 'ready' },
    }

    run = confirmWheel(run, 'school-events-2')

    expect(run.flow.step).toBe('special-event')
    expect(run.stack.at(-1)?.returnTo).toEqual({
      phase: 'primary-school',
      step: 'stage-summary',
      status: 'ready',
    })
    expect(run.stack.at(-1)?.queue).toHaveLength(1)
  })

  it('raises maxLevel when an event applies max-soul-power', () => {
    const event = rewriteEvents.find((candidate) => candidate.id === 'high-near-death')
    expect(event).toBeDefined()
    const base = createRun(42, NOW, 'run-1')
    const run: RewriteRun = {
      ...base,
      character: {
        ...base.character,
        name: '林云深',
        race: 'human',
        raceName: '人族',
        level: 60,
        maxLevel: 100,
      },
      flow: { phase: 'high-school', step: 'special-event', status: 'result-pending' },
      stack: [{
        returnTo: { phase: 'high-school', step: 'year-3', status: 'ready' },
        queue: [],
        context: {},
      }],
      pending: {
        kind: 'wheel',
        id: 'near-death-result',
        optionId: 'high-near-death',
        title: event!.name,
        description: event!.description,
        effects: [],
        payload: event,
      },
    }

    const next = reduceRewriteRun(run, { type: 'CONFIRM_RESULT' }, deps())

    expect(next.character.maxLevel).toBe(110)
    expect(next.character.level).toBe(50)
    expect(next.character.titles).toContain('重生意志')
  })
})

