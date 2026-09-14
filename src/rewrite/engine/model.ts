export const RUN_VERSION = 2 as const

export type Gender = 'male' | 'female'
export type Race = 'human' | 'half-beast' | 'soul-beast' | 'divine' | 'ghost'
export type SpiritCategory = 'tool' | 'beast' | 'nature' | 'body' | 'special'
export type RingQuality =
  | 'white'
  | 'yellow'
  | 'purple'
  | 'black'
  | 'red'
  | 'gold-white'
  | 'divine'

export type ActivityStatus =
  | 'ready'
  | 'animating'
  | 'result-pending'
  | 'choice-pending'
  | 'completed'

export type FlowPhase =
  | 'creation'
  | 'primary-school'
  | 'middle-school'
  | 'high-school'
  | 'contest'
  | 'adult'
  | 'soul-beast'
  | 'ending'

export type Flow = {
  phase: FlowPhase
  step: string
  status: ActivityStatus
}

export type SpiritState = {
  id: string
  name: string
  category: SpiritCategory
  quality: string
  evolvedFrom: string | null
  fusionIds: string[]
}

export type RingState = {
  id: string
  index: number
  years: number
  quality: RingQuality
  skillName: string
  description: string
}

export type BoneSlot =
  | 'head'
  | 'torso'
  | 'left-arm'
  | 'right-arm'
  | 'left-leg'
  | 'right-leg'
  | 'wing'

export type BoneQuality =
  | 'common'
  | 'refined'
  | 'rare'
  | 'legendary'
  | 'divine'

export type BoneState = {
  id: string
  slot: BoneSlot
  quality: BoneQuality
  name: string
  source: string
}

export type BoneMap = Record<BoneSlot, BoneState | null>

export type RewriteCharacter = {
  name: string
  gender: Gender | null
  race: Race | null
  raceName: string
  birthYear: number
  currentYear: number
  level: number
  maxLevel: number
  spiritCount: 0 | 1 | 2 | 3 | 4
  spirits: SpiritState[]
  rings: RingState[]
  bones: BoneMap
  flags: string[]
  looks: number
  birthPlace: string
  innatePower: number
  talentId: string | null
  endingId: string | null
  schoolRecords: Array<{
    tier: 'primary' | 'middle' | 'high'
    schoolId: string
    schoolName: string
    startYear: number
    endYear: number | null
  }>
  titles: string[]
  items: string[]
  knowledge: string[]
  relationships: {
    sanctuary: number
    empire: number
    beasts: number
    reputation: number
  }
  partner: string | null
  growthMultiplier: number
  lastHeroInteractionYear: number | null
  heroWins: number
  heroLosses: number
  heroDraws: number
  contestAppearances: number
  contestBestRank: 'champion' | 'runner-up' | 'top4' | 'top8' | 'participant' | null
}

export type WheelPendingResult = {
  kind: 'wheel'
  id: string
  optionId: string
  title: string
  description: string
  effects: string[]
  payload: unknown
}

export type EventChoicePendingResult = {
  kind: 'event-choice'
  id: string
  title: string
  description: string
  choices: Array<{
    id: string
    label: string
    description: string
  }>
  payload: unknown
}

export type PendingResult = WheelPendingResult | EventChoicePendingResult

export type ActivityFrame = {
  returnTo: Flow
  queue: Flow[]
  context: Record<string, string | number | boolean | string[]>
}

export type HistoryEntryType =
  | 'run-start'
  | 'run-restart'
  | 'wheel'
  | 'choice'
  | 'spirit'
  | 'soul-ring'
  | 'level'
  | 'phase'
  | 'ending'

export type HistoryEntry = {
  id: string
  runId: string
  at: string
  type: HistoryEntryType
  summary: string
}

export type ValidSnapshot = {
  createdAt: string
  character: RewriteCharacter
  flow: Flow
  stack: ActivityFrame[]
  rngCursor: number
  creation: {
    activeSpiritIndex: number
    spiritCategories: Array<SpiritCategory | null>
  }
}

export type RewriteRun = {
  version: typeof RUN_VERSION
  id: string
  seed: number
  rngCursor: number
  createdAt: string
  updatedAt: string
  /** Content pack that produced this run — must match active pack to resume. */
  packId: string
  packVersion: string
  character: RewriteCharacter
  flow: Flow
  stack: ActivityFrame[]
  pending: PendingResult | null
  history: HistoryEntry[]
  snapshot: ValidSnapshot | null
  creation: {
    activeSpiritIndex: number
    spiritCategories: Array<SpiritCategory | null>
  }
}

export type RewriteCommand =
  | { type: 'CONFIRM_IDENTITY'; name: string; gender: Gender }
  | { type: 'START_WHEEL' }
  | { type: 'ANIMATION_FINISHED' }
  | { type: 'CONFIRM_RESULT' }
  | { type: 'CHOOSE_EVENT'; choiceId: string }
  | { type: 'CONTINUE' }
