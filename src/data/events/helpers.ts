import type {
  ContentEventEffect as EventEffect,
  ContentGameEvent as GameEvent,
  SchoolTier,
} from '../../rewrite/content/types'

export function event(
  stage: SchoolTier | 'adult' | 'common',
  id: string,
  name: string,
  description: string,
  effects: EventEffect[] = [],
): GameEvent {
  return { id: `${stage}-${id}`, name, stage, description, weight: 1, effects }
}

export const power = (amount: number): EventEffect => ({ type: 'soul-power', amount })
export const title = (id: string): EventEffect => ({ type: 'title', id })
export const flag = (id: string): EventEffect => ({ type: 'flag', id })
export const item = (id: string): EventEffect => ({ type: 'item', id })
export const knowledge = (id: string): EventEffect => ({ type: 'knowledge', id })
export const relationship = (
  faction: 'sanctuary' | 'empire' | 'beasts' | 'reputation',
  amount: number,
): EventEffect => ({ type: 'relationship', faction, amount })
