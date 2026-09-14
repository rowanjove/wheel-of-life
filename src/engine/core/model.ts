/**
 * WOL 2.0 通用数据模型 (Generic Core Model)
 * 引擎层彻底与具体世界观解耦，不包含任何作品专属属性或概念。
 */

export type StatMap = Record<string, number>
export type FactionId = string
export type FactionRelations = Record<FactionId, number>

export type ItemType =
  | 'consumable'
  | 'key'
  | 'material'
  | 'equipment'
  | 'collectible'

export interface InventoryItem {
  id: string
  name?: string
  description?: string
  type: ItemType | string
  quantity?: number
  durability?: number
  metadata?: Record<string, unknown>
}

export interface ItemDefinition {
  id: string
  name: string
  description: string
  type: ItemType
  stackable?: boolean
  effects?: unknown[]
  modifiers?: Modifier[]
  eventWeightModifiers?: EventWeightModifier[]
  tags?: string[]
}

export interface MilestoneState {
  id: string
  name: string
  achievedAtYear: number
  achievedAtAge: number
  metadata?: Record<string, unknown>
}

export interface MemoryRecord {
  id: string
  type: string
  sourceEventId: string
  age: number
  year: number
  tags: string[]
  data?: Record<string, unknown>
}

export interface ScheduledEvent {
  id: string
  eventId: string
  triggerAge?: number
  triggerYear?: number
  delayYears?: number
  conditions?: unknown
  sourceEventId?: string
  payload?: Record<string, unknown>
}

export type LifeRecordType =
  | 'birth'
  | 'event'
  | 'choice'
  | 'wheel'
  | 'milestone'
  | 'career'
  | 'relationship'
  | 'world'
  | 'ending'

export interface LifeRecord {
  age: number
  year: number
  title: string
  description?: string
  type: LifeRecordType
  timestamp?: number
  metadata?: Record<string, unknown>
}

export interface CharacterState {
  id: string
  name: string
  gender: 'male' | 'female' | 'other' | null
  age: number
  months?: number // 累计经历总月数
  birthYear: number
  currentYear: number
  alive: boolean
  causeOfDeath?: string

  // 基础能力数值映射 (如 体魄, 悟性, 才学, 容貌, 家境等)
  stats: StatMap

  // 动态状态数值 (如 健康, 财富, 压力, 声望, 寿元, 灵石等)
  status?: StatMap

  // 先天天赋 ID 列表 (开局 6 选 3)
  talents: string[]

  // 后天获得特质 ID 列表
  traits: string[]

  originId?: string
  careerId?: string

  // 动态组织/阵营好感度与社会关系
  factionRelations: FactionRelations
  relationships: Record<string, number>

  // 通用背包与物品
  inventory: InventoryItem[]

  // 人生成就/关键突破里程碑
  milestones: MilestoneState[]

  // 状态与事件标记
  flags: string[]

  // 关键人生记忆（因果回响基础）
  memories: MemoryRecord[]

  // 延期/计划发生事件
  scheduledEvents: ScheduledEvent[]

  // 人生历史大事记
  history: LifeRecord[]
}

export interface FactionState {
  id: string
  name: string
  influence: number
  description?: string
  variables?: Record<string, number | string | boolean>
}

export interface WorldHistoryRecord {
  year: number
  title: string
  description: string
  tags?: string[]
}

export interface WorldState {
  year: number
  variables: Record<string, number | string | boolean>
  factions: Record<string, FactionState>
  activeEvents: string[]
  history: WorldHistoryRecord[]
}

export interface Modifier {
  target: 'stat' | 'relation' | 'faction' | 'variable'
  key: string
  value: number
  mode?: 'add' | 'multiply' | 'set'
}

export interface EventWeightModifier {
  eventId?: string
  tag?: string
  category?: string
  multiplier: number
}

export interface TraitDefinition {
  id: string
  name: string
  description: string
  rarity?: number
  conditions?: unknown
  modifiers?: Modifier[]
  eventWeightModifiers?: EventWeightModifier[]
  incompatible?: string[]
  replacements?: string[]
  maxTriggerCount?: number
  tags?: string[]
}

export interface OriginDefinition {
  id: string
  name: string
  description: string
  conditions?: unknown
  initialStats?: Record<string, number>
  initialTraits?: string[]
  initialItems?: string[]
  initialRelations?: Record<string, number>
  initialFactionRelations?: Record<string, number>
  initialFlags?: string[]
  eventWeightModifiers?: EventWeightModifier[]
}

export interface FactionDefinition {
  id: string
  name: string
  description?: string
  initialInfluence?: number
  initialRelations?: Record<string, number>
}

export interface WorldManifest {
  id: string
  name: string
  version: string
  author?: string
  description?: string
  engineVersion: string
  entry: string
}
