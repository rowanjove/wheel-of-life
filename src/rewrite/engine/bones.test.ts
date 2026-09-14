import { describe, expect, it } from 'vitest'
import { createRun } from './factory'
import {
  emptyBones,
  resolveBoneRollFlags,
  bonePowerBonus,
  tryRollBone,
} from './bones'

describe('bones', () => {
  it('awards a bone when roll flags succeed', () => {
    const run = createRun(99, '2026-06-20T00:00:00.000Z', 'run-1')
    const rolled = tryRollBone(
      {
        ...run,
        character: {
          ...run.character,
          flags: ['roll-common-bone-30'],
        },
      },
      { quality: 'common', chance: 100, source: '测试' },
    )

    expect(rolled.character.bones).not.toEqual(emptyBones())
    expect(bonePowerBonus(rolled.character)).toBe(200)
  })

  it('resolves event bone flags after special events', () => {
    const run = createRun(7, '2026-06-20T00:00:00.000Z', 'run-1')
    const resolved = resolveBoneRollFlags({
      ...run,
      character: {
        ...run.character,
        flags: ['roll-refined-bone-50'],
      },
    })

    expect(resolved.character.flags).not.toContain('roll-refined-bone-50')
  })

  it('triggers bone-choice when all slots occupied and advances rngCursor strictly', () => {
    const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
    // 填满所有骨骼槽位
    let character = run.character
    const slots = ['head', 'torso', 'left-arm', 'right-arm', 'left-leg', 'right-leg', 'wing'] as const
    for (const slot of slots) {
      character = {
        ...character,
        bones: {
          ...character.bones,
          [slot]: { id: `bone-${slot}`, slot, quality: 'common', name: `旧${slot}`, source: '旧' },
        },
      }
    }

    const initialCursor = run.rngCursor
    const rolled = tryRollBone(
      { ...run, character },
      { quality: 'legendary', chance: 100, source: '测试冲突' },
    )

    expect(rolled.flow.step).toBe('bone-choice')
    expect(rolled.rngCursor).toBeGreaterThan(initialCursor)
    expect(rolled.stack.length).toBeGreaterThan(0)
    expect(rolled.stack.at(-1)?.context.boneQuality).toBe('legendary')
  })
})