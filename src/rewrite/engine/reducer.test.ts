import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import { reduceRewriteRun, type ReducerDependencies } from './reducer'

const deps: ReducerDependencies = {
  now: () => '2026-06-20T00:00:00.000Z',
  nextId: () => 'result-1',
  pickOption: (options) => options.find((option) => option.id === 'looks-8')!,
}

describe('rewrite reducer wheel timing', () => {
  it('locks the selected result before animation and reveals it only when animation finishes', () => {
    const identity = reduceRewriteRun(
      createRun(42, deps.now(), 'run-1'),
      { type: 'CONFIRM_IDENTITY', name: '林云深', gender: 'male' },
      deps,
    )

    const animating = reduceRewriteRun(identity, { type: 'START_WHEEL' }, deps)
    expect(animating.flow.status).toBe('animating')
    expect(animating.pending?.id).toBe('result-1')
    expect(animating.pending?.kind === 'wheel' && animating.pending.optionId).toBe('looks-8')

    const visible = reduceRewriteRun(animating, { type: 'ANIMATION_FINISHED' }, deps)
    expect(visible.flow.status).toBe('result-pending')
    expect(visible.pending?.id).toBe('result-1')
  })

  it('generates a legal soul ring and opens its follow-up event', () => {
    const base = createRun(42, deps.now(), 'run-1')
    const run = {
      ...base,
      character: { ...base.character, level: 10 },
      flow: { phase: 'primary-school' as const, step: 'soul-ring-1', status: 'ready' as const },
      stack: [{
        returnTo: { phase: 'primary-school' as const, step: 'year-2', status: 'ready' as const },
        queue: [],
        context: {},
      }],
    }
    const ringDeps: ReducerDependencies = {
      ...deps,
      pickOption: (options) => options.find((option) => option.id === 'ring-1-white-10-19')!,
    }

    const animating = reduceRewriteRun(run, { type: 'START_WHEEL' }, ringDeps)
    const stopped = reduceRewriteRun(animating, { type: 'ANIMATION_FINISHED' }, ringDeps)
    const confirmed = reduceRewriteRun(stopped, { type: 'CONFIRM_RESULT' }, ringDeps)

    expect(confirmed.character.rings).toHaveLength(1)
    expect(confirmed.character.rings[0].years).toBeGreaterThanOrEqual(10)
    expect(confirmed.character.rings[0].years).toBeLessThanOrEqual(19)
    expect(confirmed.flow.step).toBe('special-event')
  })

  it('runs contest, adult and soul-beast wheels through persistable result steps', () => {
    const base = createRun(42, deps.now(), 'run-1')
    const contest = {
      ...base,
      flow: { phase: 'contest' as const, step: 'semifinal', status: 'ready' as const },
    }
    const contestDeps: ReducerDependencies = {
      ...deps,
      pickOption: (options) => options.find((option) => option.id === 'contest-win')!,
    }
    const contestResult = reduceRewriteRun(
      reduceRewriteRun(
        reduceRewriteRun(contest, { type: 'START_WHEEL' }, contestDeps),
        { type: 'ANIMATION_FINISHED' },
        contestDeps,
      ),
      { type: 'CONFIRM_RESULT' },
      contestDeps,
    )
    expect(contestResult.flow.step).toBe('final')

    const adult = {
      ...base,
      character: { ...base.character, currentYear: 20 },
      flow: { phase: 'adult' as const, step: 'year-3', status: 'ready' as const },
    }
    const adultDeps: ReducerDependencies = {
      ...deps,
      pickOption: (options) => options.find((option) => option.id === 'adult-growth-2')!,
    }
    const adultResult = reduceRewriteRun(
      reduceRewriteRun(
        reduceRewriteRun(adult, { type: 'START_WHEEL' }, adultDeps),
        { type: 'ANIMATION_FINISHED' },
        adultDeps,
      ),
      { type: 'CONFIRM_RESULT' },
      adultDeps,
    )
    expect(adultResult.character.currentYear).toBe(21)
    expect(adultResult.flow.step).toBe('year-4')

    const beast = {
      ...base,
      character: { ...base.character, race: 'soul-beast' as const },
      flow: {
        phase: 'soul-beast' as const,
        step: 'cultivation-year-1',
        status: 'ready' as const,
      },
    }
    const beastDeps: ReducerDependencies = {
      ...deps,
      pickOption: (options) => options.find((option) => option.id === 'beast-cultivation-transform')!,
    }
    const beastResult = reduceRewriteRun(
      reduceRewriteRun(
        reduceRewriteRun(beast, { type: 'START_WHEEL' }, beastDeps),
        { type: 'ANIMATION_FINISHED' },
        beastDeps,
      ),
      { type: 'CONFIRM_RESULT' },
      beastDeps,
    )
    expect(beastResult.character.race).toBe('half-beast')
    expect(beastResult.flow.phase).toBe('adult')
  })

  it('finalizes an adult ending check through continue', () => {
    const base = createRun(42, deps.now(), 'run-1')
    const run = {
      ...base,
      character: {
        ...base.character,
        name: '林云深',
        level: 90,
        birthYear: 1,
        currentYear: 121,
      },
      flow: { phase: 'adult' as const, step: 'ending-check', status: 'ready' as const },
    }

    const ended = reduceRewriteRun(run, { type: 'CONTINUE' }, deps)

    expect(ended.flow.phase).toBe('ending')
    expect(ended.history.at(-1)?.type).toBe('ending')
  })
})
