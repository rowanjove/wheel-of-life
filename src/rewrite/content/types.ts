export type ContentSpiritCategory = 'tool' | 'animal' | 'nature'
export type ContentSpiritQuality =
  | '废'
  | '普通'
  | '良好'
  | '优秀'
  | '超绝'
  | '神级'
  | '传说'
  | '至尊'

export type ContentSpirit = {
  id: string
  name: string
  category: ContentSpiritCategory
  quality: ContentSpiritQuality
}

export type ContentWheelOption<T = unknown> = {
  id: string
  name: string
  weight: number
  color: string
  description: string
  value: T
}

export interface ContentTalent {
  id: string
  name: string
  tier: 'ordinary' | 'good' | 'rare' | 'divine' | 'legendary'
  description: string
}

export type EndingId =
  | 'divine-companion'
  | 'human-god'
  | 'legend-finale'
  | 'hero-rest'
  | 'ordinary-life'
  | 'passing-traveler'
  | 'gracious-retirement'
  | 'rival-legend'
  | 'spirit-hall-child'
  | 'spirit-hall-remnant'
  | 'reckoning-day'
  | 'island-hermit'

export type SchoolTier = 'primary' | 'middle' | 'high'
export type Region = 'heaven-dou' | 'star-luo' | 'moon-string' | 'far-east'

export interface ContentSchool {
  id: string
  name: string
  tier: SchoolTier
  region: Region
  location: string
  feature: string
  annualBonus: number
  tags: string[]
  minimumSoulPower?: number
  requiredSpiritTags?: string[]
  requiredTalentTiers?: ContentTalent['tier'][]
  selectionWeight?: number
}

export type ContentActivity =
  | { kind: 'idle' }
  | { kind: 'identity' }
  | { kind: 'creation-wheel'; step: string }
  | { kind: 'destiny-confirmation' }
  | { kind: 'school-selection'; tier: SchoolTier }
  | { kind: 'year'; yearIndex: number }
  | { kind: 'event-count'; tier: SchoolTier | 'adult' }
  | { kind: 'event'; eventId: string }
  | { kind: 'soul-ring'; ringIndex: number }
  | { kind: 'soul-bone-choice'; boneId: string }
  | { kind: 'contest'; round: string }
  | { kind: 'hero-interaction' }
  | { kind: 'opportunity-wheel' }
  | { kind: 'stage-summary'; tier: SchoolTier }
  | { kind: 'adult-cycle'; cycle: number }
  | { kind: 'ending'; endingId: EndingId }

export interface ContentRelationshipState {
  sanctuary: number
  empire: number
  beasts: number
  reputation: number
}

export type ContentEventEffect =
  | { type: 'soul-power'; amount: number }
  | { type: 'max-soul-power'; amount: number }
  | { type: 'growth-multiplier'; amount: number }
  | { type: 'title' | 'flag' | 'item' | 'knowledge'; id: string }
  | { type: 'partner'; name: string }
  | {
      type: 'relationship'
      faction: keyof ContentRelationshipState
      amount: number
    }
  | { type: 'hero-unlock' }
  | { type: 'queue-activity'; activity: ContentActivity }
  | { type: 'composite'; effects: ContentEventEffect[] }

export interface ContentGameEventChoice {
  id: string
  label: string
  effects: ContentEventEffect[]
}

export interface ContentGameEvent {
  id: string
  name: string
  stage: SchoolTier | 'adult' | 'common'
  description: string
  weight: number
  requiredFlags?: string[]
  forbiddenFlags?: string[]
  effects?: ContentEventEffect[]
  choices?: ContentGameEventChoice[]
}
