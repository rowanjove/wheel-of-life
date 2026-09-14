import type { CharacterState, WorldState } from '../core/model'

export interface EndingDefinition {
  id: string
  title: string
  description: string
  category?: string
  conditions?: unknown
  rarity?: number
}

export interface EndingResult {
  baseEndingId: string
  title: string
  tags: string[]
  careerSummary: string
  relationshipSummary: string
  wealthSummary: string
  worldSummary: string
  epitaph: string
  score: number
}

export function resolveEnding(
  character: CharacterState,
  world?: WorldState,
): EndingResult {
  const { age, stats, flags, memories } = character
  const wealth = stats.wealth ?? 0
  const knowledge = stats.knowledge ?? 0
  const reputation = stats.reputation ?? 0
  const health = stats.health ?? 0

  let baseEndingId = 'ending-peaceful-life'
  let title = '平凡岁月'
  const tags: string[] = []

  // 1. 基础结局决议
  if (age < 50 && health <= 0) {
    baseEndingId = 'ending-burnout'
    title = '积劳成疾'
    tags.push('regret', 'early-death')
  } else if (wealth >= 250 && (flags.includes('founder') || flags.includes('industry-leader'))) {
    baseEndingId = 'ending-wealth-tycoon'
    title = '商界巨擘'
    tags.push('tycoon', 'wealthy', 'success')
  } else if (knowledge >= 85 && (flags.includes('top-univ-grad') || flags.includes('olympiad-candidate'))) {
    baseEndingId = 'ending-academic-master'
    title = '博学泰斗'
    tags.push('scholar', 'intellect', 'prestige')
  } else if (reputation >= 60 && memories.some((m) => m.tags.includes('leadership') || m.tags.includes('honor'))) {
    baseEndingId = 'ending-social-pillar'
    title = '德高望重'
    tags.push('pillar', 'revered', 'reputation')
  } else if (age >= 75) {
    baseEndingId = 'ending-centenarian'
    title = '福寿天成'
    tags.push('longevity', 'peace')
  } else {
    baseEndingId = 'ending-peaceful-life'
    title = '平凡岁月'
    tags.push('ordinary', 'peace')
  }

  // 2. 职业轨迹评价
  let careerSummary = '一生脚踏实地，在平凡的岗位上尽心尽力。'
  if (flags.includes('founder') || flags.includes('industry-leader')) {
    careerSummary = '敢为人先创立企业，在波诡云谲的商海中书写了属于自己的商业篇章。'
  } else if (flags.includes('top-univ-grad') || knowledge >= 60) {
    careerSummary = '致力于专业领域深耕探索，其学识与洞察赢得了同行的持久敬重。'
  } else if (flags.includes('corporate-director')) {
    careerSummary = '在成熟企业稳扎稳打，成为团队和下属最信任的领路人。'
  }

  // 3. 财富评价
  let wealthSummary = '衣食富足，财务自洽。'
  if (wealth >= 200) {
    wealthSummary = '累积了令人瞩目的雄厚资产，留下了丰厚的家族与社会基业。'
  } else if (wealth <= 10) {
    wealthSummary = '两袖清风，不以物喜，精神世界远比账面数字更加丰富。'
  }

  // 4. 人际关系与记忆回响
  let relationshipSummary = '亲朋好友相伴身旁，晚年温馨坦然。'
  if (memories.some((m) => m.type === 'respected-elder')) {
    relationshipSummary = '门生故吏遍天下，提携后进无数，深受后辈爱戴。'
  } else if (memories.some((m) => m.type === 'study-group-leader')) {
    relationshipSummary = '青年时期结识的知己一生未断联络，风雨同舟数十载。'
  }

  // 5. 世界时代评价
  let worldSummary = '生活在一个平稳发展的大时代。'
  if (world?.activeEvents.includes('tech-boom')) {
    worldSummary = '亲历了科技与产业呼啸而过的黄金繁荣年代。'
  } else if (world?.variables.inWar) {
    worldSummary = '在激荡动荡的世界局势中守住了家庭的港湾。'
  }

  // 6. 综合墓志铭
  let epitaph = `【${character.name}】（享年 ${age} 岁）\n`
  epitaph += `${careerSummary}\n${relationshipSummary}\n${wealthSummary}`

  // 7. 人生成就分
  const score = Math.round(
    age * 1.5 +
      wealth * 0.8 +
      knowledge * 1.2 +
      reputation * 1.5 +
      memories.length * 10 +
      character.milestones.length * 15,
  )

  return {
    baseEndingId,
    title,
    tags,
    careerSummary,
    relationshipSummary,
    wealthSummary,
    worldSummary,
    epitaph,
    score,
  }
}
