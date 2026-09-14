import type { FactionDefinition, ItemDefinition, OriginDefinition, TraitDefinition, WorldManifest } from '../engine/core/model'
import type { StatDefinition } from '../engine/character/stats'
import type { TalentDefinition } from '../engine/character/talents'
import type { EndingDefinition } from '../engine/ending/endingResolver'
import type { EventDefinition } from '../engine/events/schema'

export interface WorldPackManifest extends WorldManifest {
  wheelMode: 'single' | 'category'
  initialPoints?: number // 开局自由属性分配点数（默认 20）
  tone?: string // 沉稳 / 荒诞 / 江湖感 / 现实幽默
  stages?: {
    id: string
    name: string
    minAge?: number
    maxAge?: number
    description?: string
  }[]
}

export interface WorldPack {
  manifest: WorldPackManifest
  stats: StatDefinition[]
  talents: TalentDefinition[]
  traits: TraitDefinition[]
  items: ItemDefinition[]
  origins: OriginDefinition[]
  factions: FactionDefinition[]
  events: EventDefinition[]
  endings: EndingDefinition[]
}
