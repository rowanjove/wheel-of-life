import type { RewriteCharacter } from './model'
import type { RingModifiers } from './rings'
import type { WheelOption } from './creation'

export function heroInteractionCooldownYears(talentId: string | null): number {
  return talentId === 'hero-rival' ? 1 : 5
}

export function canStartHeroInteraction(character: RewriteCharacter): boolean {
  const cooldown = heroInteractionCooldownYears(character.talentId)
  const last = character.lastHeroInteractionYear
  if (last === null) return true
  return character.currentYear - last >= cooldown
}

export function applyTalentAcquisition(
  character: RewriteCharacter,
  talentId: string | null,
): RewriteCharacter {
  if (!talentId) return character

  let next = { ...character, talentId }
  if (talentId === 'rapid-cultivation') {
    next = { ...next, growthMultiplier: next.growthMultiplier + 0.2 }
  }
  if (talentId === 'divine-speed-growth') {
    next = { ...next, growthMultiplier: next.growthMultiplier + 0.5 }
  }
  if (talentId === 'ancient-inheritance') {
    next = {
      ...next,
      knowledge: [...new Set([...next.knowledge, 'hidden-skill'])],
    }
  }
  if (talentId === 'divine-perception') {
    next = {
      ...next,
      flags: [...new Set([...next.flags, 'divine-perception'])],
    }
  }
  return next
}

export function growthAmount(
  character: RewriteCharacter,
  baseGrowth: number,
): number {
  let amount = baseGrowth * character.growthMultiplier
  if (character.talentId === 'talent-manifestation') {
    amount *= 1 + Math.min(1, character.innatePower / 20)
  }
  return amount
}

export function adjustLevelDelta(
  character: RewriteCharacter,
  delta: number,
  source: 'default' | 'hero' | 'contest' = 'default',
): number {
  if (delta >= 0) return delta
  let adjusted = delta
  if (character.talentId === 'resilient-body') {
    adjusted *= 0.5
  }
  if (
    source !== 'default' &&
    character.talentId === 'battle-resonance'
  ) {
    return 0
  }
  return adjusted
}

export function talentEventLevelBonus(talentId: string | null): number {
  return talentId === 'divine-speed-growth' ? 2 : 0
}

export function talentRingModifiers(talentId: string | null): RingModifiers {
  if (talentId !== 'ring-affinity') return {}
  return {
    qualityMultipliers: {
      yellow: 1.35,
      purple: 1.3,
      black: 1.25,
      red: 1.2,
      'gold-white': 1.15,
    },
  }
}

export function contestWinWeightBonus(talentId: string | null): number {
  return talentId === 'natural-fighter' ? 12 : 0
}

export function adjustWheelOptions<T>(
  options: readonly WheelOption<T>[],
  talentId: string | null,
): WheelOption<T>[] {
  if (talentId !== 'legendary-form' || options.length < 2) {
    return options.map((option) => ({ ...option }))
  }

  const midpoint = Math.ceil(options.length / 2)
  const shift = options.reduce((sum, option) => sum + option.weight, 0) * 0.1
  const perLower = shift / midpoint
  const perUpper = shift / (options.length - midpoint)

  return options.map((option, index) => ({
    ...option,
    weight: Math.max(
      0.01,
      index < midpoint
        ? option.weight - perLower
        : option.weight + perUpper,
    ),
  }))
}