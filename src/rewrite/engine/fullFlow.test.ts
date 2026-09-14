import { describe, expect, it } from 'vitest'
import type { WheelOption } from './creation'
import type { RewriteCommand, RewriteRun } from './model'
import { reduceRewriteRun } from './reducer'
import {
  createRewriteRepository,
  type StorageLike,
} from '../storage/repository'
import {
  createRewriteStore,
  type RewriteStore,
  type RewriteStoreDependencies,
} from '../store/gameStore'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

function optionPicker(race: 'human' | 'soul-beast') {
  return (options: readonly WheelOption[]) => {
    const ids = new Set(options.map((option) => option.id))
    const priorities = [
      `race-${race}`,
      'spirit-count-4',
      'power-40',
      'contest-narrow-loss',
      'adult-events-3',
      'adult-growth-4',
      'year-growth-4',
      'beast-cultivation-transform',
    ]
    for (const id of priorities) {
      const match = options.find((option) => option.id === id)
      if (match) return match
    }
    if ([...ids].some((id) => id.startsWith('ring-'))) return options.at(-1)!
    return options[0]
  }
}

function deterministicStore(race: 'human' | 'soul-beast'): RewriteStore {
  let id = 0
  const reducerDependencies = {
    now: () => '2026-06-20T00:00:00.000Z',
    nextId: () => `result-${++id}`,
    pickOption: optionPicker(race),
  }
  const dependencies: RewriteStoreDependencies = {
    now: reducerDependencies.now,
    nextId: reducerDependencies.nextId,
    nextSeed: () => 42,
    reduce: (run: RewriteRun, command: RewriteCommand) =>
      reduceRewriteRun(run, command, reducerDependencies),
  }
  return createRewriteStore(
    createRewriteRepository(memoryStorage()),
    dependencies,
  )
}

function playToEnding(store: RewriteStore) {
  store.getState().dispatch({
    type: 'CONFIRM_IDENTITY',
    name: '林云深',
    gender: 'male',
  })

  for (let guard = 0; guard < 600; guard += 1) {
    const run = store.getState().run
    if (run.flow.phase === 'ending') return run
    if (run.flow.status === 'choice-pending') {
      const choiceId = run.pending?.kind === 'event-choice'
        ? run.pending.choices[0]?.id
        : null
      if (!choiceId) throw new Error('事件缺少可选项')
      store.getState().dispatch({ type: 'CHOOSE_EVENT', choiceId })
      continue
    }
    if (
      run.flow.step === 'creation-summary' ||
      run.flow.step === 'stage-summary' ||
      run.flow.step === 'ending-check'
    ) {
      store.getState().dispatch({ type: 'CONTINUE' })
      continue
    }
    store.getState().dispatch({ type: 'START_WHEEL' })
    store.getState().dispatch({ type: 'ANIMATION_FINISHED' })
    store.getState().dispatch({ type: 'CONFIRM_RESULT' })
  }
  const state = store.getState()
  throw new Error(
    `完整人生在限定步数内没有抵达结局：${state.run.flow.phase}/${state.run.flow.step}/${state.run.flow.status}；${state.error}`,
  )
}

describe('complete rewrite flow through public store commands', () => {
  it('plays a four-spirit human life through schools, rings, contest and ending', () => {
    const store = deterministicStore('human')
    const ended = playToEnding(store)

    expect(ended.character.spiritCount).toBe(4)
    expect(new Set(ended.character.spirits.map((spirit) => spirit.id)).size).toBe(4)
    expect(ended.character.rings).toHaveLength(9)
    expect(ended.character.rings.every((ring, index, rings) =>
      index === 0 || ring.years > rings[index - 1].years,
    )).toBe(true)
    expect(ended.flow.phase).toBe('ending')
  })

  it('plays a human life that wins the contest final and survives tang san', () => {
    let id = 0
    const reducerDependencies = {
      now: () => '2026-06-20T00:00:00.000Z',
      nextId: () => `result-${++id}`,
      pickOption: (options: readonly WheelOption[]) => {
        const ids = new Set(options.map((option) => option.id))
        const priorities = [
          'race-human',
          'spirit-count-1',
          'power-20',
          'contest-win',
          'hero-draw',
          'adult-events-3',
          'adult-growth-1',
          'year-growth-1',
        ]
        for (const priority of priorities) {
          const match = options.find((option) => option.id === priority)
          if (match) return match
        }
        if ([...ids].some((value) => value.startsWith('ring-'))) return options.at(-1)!
        return options[0]
      },
    }
    const dependencies: RewriteStoreDependencies = {
      now: reducerDependencies.now,
      nextId: reducerDependencies.nextId,
      nextSeed: () => 7,
      reduce: (run: RewriteRun, command: RewriteCommand) =>
        reduceRewriteRun(run, command, reducerDependencies),
    }
    const store = createRewriteStore(
      createRewriteRepository(memoryStorage()),
      dependencies,
    )
    const ended = playToEnding(store)

    expect(ended.character.flags).toContain('contest-final-draw')
    expect(ended.flow.phase).toBe('ending')
  })

  it('plays the independent soul-beast route without creating a school', () => {
    const store = deterministicStore('soul-beast')
    const ended = playToEnding(store)

    expect(ended.character.schoolRecords).toEqual([])
    expect(ended.character.flags).toContain('soul-beast-transformed')
    expect(ended.flow.phase).toBe('ending')
  })
})
