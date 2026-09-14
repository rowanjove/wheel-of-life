import type { LifeSimSession } from '../core/lifeSim'
import { initModernLife, advanceLifeStep, type StepResult } from '../core/lifeSim'

export type PlayerPolicy = 'balanced' | 'ambitious' | 'conservative'

export function autoPlayOneStep(
  session: LifeSimSession,
  policy: PlayerPolicy = 'balanced',
): StepResult {
  const { character, rng } = session

  let preferredActionId: string | undefined

  if (policy === 'ambitious') {
    if (character.age >= 22 && (character.stats.wealth ?? 0) >= 50 && rng.next() < 0.4) {
      preferredActionId = 'action-startup'
    } else if (character.age >= 18) {
      preferredActionId = rng.next() < 0.6 ? 'action-work' : 'action-study'
    } else {
      preferredActionId = 'action-study'
    }
  } else if (policy === 'conservative') {
    if ((character.stats.stress ?? 0) > 40) {
      preferredActionId = 'action-rest'
    } else {
      preferredActionId = 'action-fitness'
    }
  } else {
    if ((character.stats.health ?? 0) < 50 || (character.stats.stress ?? 0) > 50) {
      preferredActionId = 'action-rest'
    } else if (character.age >= 18 && (character.stats.wealth ?? 0) < 20) {
      preferredActionId = 'action-work'
    } else {
      preferredActionId = 'action-fitness'
    }
  }

  return advanceLifeStep(session, undefined, preferredActionId)
}

export function autoPlayFullLife(
  seed: number,
  policy: PlayerPolicy = 'balanced',
): LifeSimSession {
  let session = initModernLife(seed)

  let steps = 0
  while (!session.isFinished && steps < 120) {
    const res = autoPlayOneStep(session, policy)
    session = res.session
    steps++
  }

  return session
}
