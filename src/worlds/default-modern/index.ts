import type {
  CharacterState,
  FactionDefinition,
  OriginDefinition,
  TraitDefinition,
  WorldManifest,
} from '../../engine/core/model'
import type { Condition } from '../../engine/events/conditions'

export const modernManifest: WorldManifest = {
  id: 'default-modern',
  name: '当代人生',
  version: '1.0.0',
  description: '一个普通人在现代社会中的真实人生，充满抉择、未知、奋斗与命运的交织。',
  engineVersion: '2.0.0',
  entry: 'index.ts',
}

export interface ModernStatDefinition {
  id: string
  name: string
  min: number
  max: number
  initial: number
  description: string
}

export const modernStats: ModernStatDefinition[] = [
  { id: 'health', name: '健康', min: 0, max: 100, initial: 80, description: '身体素质与生命活力' },
  { id: 'knowledge', name: '学识', min: 0, max: 100, initial: 15, description: '智识认知与专业能力' },
  { id: 'wealth', name: '财富', min: 0, max: 10000, initial: 5, description: '可支配资产与储蓄' },
  { id: 'charisma', name: '魅力', min: 0, max: 100, initial: 50, description: '外在吸引力与人际沟通力' },
  { id: 'stress', name: '压力', min: 0, max: 100, initial: 10, description: '精神心理负担，过高损害健康' },
  { id: 'reputation', name: '声望', min: 0, max: 100, initial: 0, description: '社会影响度与同行威望' },
]

export const modernOrigins: OriginDefinition[] = [
  {
    id: 'origin-working-class',
    name: '工薪家庭',
    description: '父母是普通职工，家庭氛围平实温暖，生活勤俭持家。',
    initialStats: { health: 80, knowledge: 20, wealth: 10, charisma: 50, stress: 10, reputation: 0 },
    initialTraits: ['trait-practical'],
    initialFlags: ['family-warm'],
  },
  {
    id: 'origin-wealthy',
    name: '商贾家庭',
    description: '家境优渥，从小接受精英教育，但长辈对商业继承寄予厚望。',
    initialStats: { health: 75, knowledge: 30, wealth: 100, charisma: 65, stress: 25, reputation: 15 },
    initialTraits: ['trait-business-sense'],
    initialFlags: ['family-wealthy'],
  },
  {
    id: 'origin-academic',
    name: '书香门第',
    description: '父母皆为学者或教师，家中书卷满屋，学术氛围浓厚。',
    initialStats: { health: 70, knowledge: 45, wealth: 25, charisma: 55, stress: 20, reputation: 10 },
    initialTraits: ['trait-photographic-memory'],
    initialFlags: ['family-academic'],
  },
  {
    id: 'origin-rural',
    name: '田园乡间',
    description: '在青山绿水间长大，身体皮实抗造，性情淳朴坚韧。',
    initialStats: { health: 95, knowledge: 10, wealth: 3, charisma: 45, stress: 0, reputation: 0 },
    initialTraits: ['trait-resilient'],
    initialFlags: ['rural-grit'],
  },
  {
    id: 'origin-single-parent',
    name: '单亲坚韧',
    description: '由单亲抚养长大，早早学会独立生活并体恤家人不易。',
    initialStats: { health: 80, knowledge: 25, wealth: 8, charisma: 55, stress: 15, reputation: 0 },
    initialTraits: ['trait-independent'],
    initialFlags: ['independent-mind'],
  },
]

export const modernTraits: TraitDefinition[] = [
  {
    id: 'trait-curious',
    name: '求知若渴',
    description: '对未知事物充满好奇，探索与偶遇事件概率增加，学习收益提高。',
    rarity: 1,
    tags: ['intellect'],
  },
  {
    id: 'trait-resilient',
    name: '坚韧不拔',
    description: '逆境中拥有惊人的恢复力，遭遇挫折时压力增长减少 30%。',
    rarity: 2,
    tags: ['personality'],
  },
  {
    id: 'trait-cautious',
    name: '谨慎缜密',
    description: '行事稳扎稳打，高风险危机事件概率显著降低，但可能错失激进机会。',
    rarity: 1,
    tags: ['personality'],
  },
  {
    id: 'trait-gambler',
    name: '冒险豪赌',
    description: '偏好高风险高回报路线，投机与突破事件收益与惩罚加倍。',
    rarity: 2,
    tags: ['luck'],
  },
  {
    id: 'trait-photographic-memory',
    name: '过目不忘',
    description: '天生超常记忆，读书学习效率提升 30%，职业技能晋升更快。',
    rarity: 3,
    tags: ['talent'],
  },
  {
    id: 'trait-social-butterfly',
    name: '社交达人',
    description: '天生具有亲和力，结识贵人与社交事件权重 +50%，声望获取加速。',
    rarity: 2,
    tags: ['charisma'],
  },
  {
    id: 'trait-practical',
    name: '务实踏实',
    description: '脚踏实地工作，工薪收入稳步上升，很少产生不切实际的开销。',
    rarity: 1,
    tags: ['personality'],
  },
  {
    id: 'trait-business-sense',
    name: '敏锐商机',
    description: '善于捕捉市场风口，投资与创业成功率显著增加。',
    rarity: 2,
    tags: ['wealth'],
  },
  {
    id: 'trait-independent',
    name: '独当一面',
    description: '善于自主决策解决困难，抗压能力强。',
    rarity: 1,
    tags: ['personality'],
  },
]

export const modernFactions: FactionDefinition[] = [
  {
    id: 'corporate',
    name: '产业与商界',
    description: '各大企业巨头与创业同盟，决定商业机会与投资回报。',
    initialInfluence: 60,
  },
  {
    id: 'academia',
    name: '学界与科研院',
    description: '重点高校与前沿实验室，主导学术研究与智识认可。',
    initialInfluence: 50,
  },
  {
    id: 'community',
    name: '社会与公众',
    description: '广泛的公众声誉与社区关系，影响人脉声望与支持度。',
    initialInfluence: 40,
  },
]

export interface ModernActionDefinition {
  id: string
  name: string
  description: string
  category: 'career' | 'study' | 'health' | 'social' | 'leisure' | 'finance'
  minAge: number
  maxAge?: number
  conditions?: Condition
  cost: {
    stress?: number
    wealth?: number
    health?: number
  }
  effects: {
    knowledge?: number
    wealth?: number
    health?: number
    charisma?: number
    stress?: number
    reputation?: number
  }
  tags?: string[]
}

export const modernActions: ModernActionDefinition[] = [
  {
    id: 'action-study',
    name: '深入研习',
    description: '泡在图书馆或线上课程中刻苦钻研，提升知识储备。',
    category: 'study',
    minAge: 6,
    cost: { stress: 4 },
    effects: { knowledge: 6, stress: 3 },
  },
  {
    id: 'action-work',
    name: '全力工作',
    description: '积极投入日常职业工作，换取薪资与绩效认可。',
    category: 'career',
    minAge: 18,
    cost: { stress: 6 },
    effects: { wealth: 15, reputation: 2, stress: 4 },
  },
  {
    id: 'action-fitness',
    name: '健身锻炼',
    description: '跑步、力量训练或户外运动，强健体魄并舒缓压力。',
    category: 'health',
    minAge: 12,
    cost: { wealth: 1 },
    effects: { health: 6, stress: -5, charisma: 2 },
  },
  {
    id: 'action-socialize',
    name: '聚会社交',
    description: '参加行业峰会、朋友聚会或社团活动，拓展人脉圈。',
    category: 'social',
    minAge: 14,
    cost: { wealth: 4 },
    effects: { charisma: 5, reputation: 4, stress: -2 },
  },
  {
    id: 'action-rest',
    name: '休假疗愈',
    description: '来一场短途旅行或在家彻底放松身心，远离喧嚣。',
    category: 'leisure',
    minAge: 0,
    cost: { wealth: 3 },
    effects: { stress: -15, health: 3 },
  },
  {
    id: 'action-invest',
    name: '财富理财',
    description: '将结余资金配置到理财、股票或实业项目中。',
    category: 'finance',
    minAge: 20,
    cost: { wealth: 10, stress: 3 },
    effects: { wealth: 18, stress: 2 },
  },
  {
    id: 'action-startup',
    name: '开拓创业',
    description: '组建团队，孵化自己的商业项目，追求改变赛道。',
    category: 'career',
    minAge: 22,
    cost: { wealth: 50, stress: 20 },
    effects: { reputation: 12, knowledge: 8, wealth: 35 },
  },
]

export interface ModernEventChoice {
  id: string
  text: string
  description?: string
  conditions?: Condition
  effects: {
    statChanges?: Record<string, number>
    addTraits?: string[]
    addFlags?: string[]
    removeFlags?: string[]
    addMemory?: { type: string; tags: string[] }
    scheduleEventId?: string
    scheduleDelay?: number
  }
}

export interface ModernEventDefinition {
  id: string
  title: string
  description: string
  ageRange: [number, number]
  conditions?: Condition
  weight: number
  oncePerRun?: boolean
  choices: ModernEventChoice[]
  tags?: string[]
}

export const modernEvents: ModernEventDefinition[] = [
  {
    id: 'event-kindergarten-talent',
    title: '启蒙天赋展现',
    description: '在幼儿园的一次手工绘画课上，老师惊讶地发现你的构图能力远超同龄人。',
    ageRange: [3, 6],
    weight: 10,
    oncePerRun: true,
    choices: [
      {
        id: 'c-art',
        text: '专注兴趣，积极培养艺术感知',
        effects: {
          statChanges: { charisma: 6, knowledge: 4 },
          addMemory: { type: 'early-talent', tags: ['art', 'creative'] },
        },
      },
      {
        id: 'c-normal',
        text: '顺其自然，享受纯真无忧的童年',
        effects: {
          statChanges: { health: 5, stress: -5 },
        },
      },
    ],
  },
  {
    id: 'event-school-exam',
    title: '期末重点统考',
    description: '迎来了小学阶段第一次决定分班的大考，考前同学们各显神通。',
    ageRange: [8, 12],
    weight: 10,
    oncePerRun: true,
    choices: [
      {
        id: 'c-study-hard',
        text: '挑灯夜战，冲刺年级前列',
        effects: {
          statChanges: { knowledge: 10, stress: 5, reputation: 4 },
          addFlags: ['honor-student'],
        },
      },
      {
        id: 'c-help-classmate',
        text: '组织互助小组，带领同学们一起复习',
        effects: {
          statChanges: { charisma: 8, knowledge: 5, reputation: 6 },
          addMemory: { type: 'study-group-leader', tags: ['friendship', 'leadership'] },
        },
      },
    ],
  },
  {
    id: 'event-adolescent-choice',
    title: '青春期的困惑与抉择',
    description: '初中时期的你在升学压力与个人志向之间感到彷徨，班主任找你长谈。',
    ageRange: [13, 16],
    weight: 10,
    oncePerRun: true,
    choices: [
      {
        id: 'c-olympiad',
        text: '全身心投入学科奥赛集训',
        effects: {
          statChanges: { knowledge: 15, stress: 10 },
          addFlags: ['olympiad-candidate'],
        },
      },
      {
        id: 'c-comprehensive',
        text: '德智体美全面发展，投身学生会与运动会',
        effects: {
          statChanges: { charisma: 10, health: 8, reputation: 8 },
          addFlags: ['student-leader'],
        },
      },
    ],
  },
  {
    id: 'event-gaokao-moment',
    title: '命运抉择：高考志愿',
    description: '那年夏天炙热无比，在答题卡封存后，摆在你面前的是决定未来航向的志愿表。',
    ageRange: [17, 19],
    weight: 20,
    oncePerRun: true,
    choices: [
      {
        id: 'c-top-univ',
        text: '报考顶尖名校硬核理工科',
        effects: {
          statChanges: { knowledge: 20, reputation: 15, stress: 10 },
          addFlags: ['top-univ-grad'],
          addMemory: { type: 'top-university', tags: ['education', 'pride'] },
        },
      },
      {
        id: 'c-biz-school',
        text: '选择经济金融专业，提前拥抱商业世界',
        effects: {
          statChanges: { wealth: 25, charisma: 12, reputation: 10 },
          addFlags: ['finance-major'],
          addMemory: { type: 'business-study', tags: ['business', 'network'] },
        },
      },
      {
        id: 'c-gap-year',
        text: '自主创业或追寻独特技艺之路',
        effects: {
          statChanges: { charisma: 15, wealth: 10, stress: 15 },
          addFlags: ['self-made-path'],
          addMemory: { type: 'alternative-path', tags: ['brave', 'venture'] },
        },
      },
    ],
  },
  {
    id: 'event-career-first-job',
    title: '初入职场的挑战',
    description: '刚入职的你面对一个关键的项目攻坚任务，导师和主管都在注视着你的表现。',
    ageRange: [22, 26],
    weight: 12,
    oncePerRun: true,
    choices: [
      {
        id: 'c-overtime',
        text: '挑灯夜战主动扛下核心模块',
        effects: {
          statChanges: { wealth: 30, knowledge: 12, reputation: 10, stress: 15, health: -5 },
          addFlags: ['fast-promoted'],
          addMemory: { type: 'workaholic-breakthrough', tags: ['career', 'promotion'] },
        },
      },
      {
        id: 'c-team-player',
        text: '协调跨部门资源，以成熟团队协作破局',
        effects: {
          statChanges: { charisma: 15, reputation: 12, wealth: 20 },
          addFlags: ['team-backbone'],
        },
      },
    ],
  },
  {
    id: 'event-startup-crossroad',
    title: '创业时代风口',
    description: '行业迎来技术革新浪潮，昔日的同窗好友拿着商业计划书邀请你共同联合创业。',
    ageRange: [27, 38],
    weight: 15,
    oncePerRun: true,
    choices: [
      {
        id: 'c-all-in-startup',
        text: '果断辞职合伙创业，背水一战',
        effects: {
          statChanges: { wealth: -20, stress: 25, reputation: 10 },
          addFlags: ['founder'],
          addMemory: { type: 'founded-company', tags: ['startup', 'risk'] },
          scheduleEventId: 'event-startup-harvest',
          scheduleDelay: 5,
        },
      },
      {
        id: 'c-keep-stable',
        text: '委婉拒绝，深耕现有成熟大厂攀登管理层',
        effects: {
          statChanges: { wealth: 45, stress: 5, reputation: 15 },
          addFlags: ['corporate-director'],
        },
      },
    ],
  },
  {
    id: 'event-startup-harvest',
    title: '五年回响：创业收获期',
    description: '五年前种下的创业种子终于迎来市场检验，产品迎来大批客户与资本关注。',
    ageRange: [32, 45],
    weight: 20,
    oncePerRun: true,
    choices: [
      {
        id: 'c-success-scale',
        text: '顺利完成融资，成为行业新锐独角兽',
        effects: {
          statChanges: { wealth: 200, reputation: 35, stress: 10 },
          addFlags: ['industry-leader'],
          addMemory: { type: 'startup-legend', tags: ['fortune', 'glory'] },
        },
      },
    ],
  },
  {
    id: 'event-health-warning',
    title: '中年健康警报',
    description: '长期的高强度作息与应酬终于亮起红灯，体检报告上几项关键指标偏高。',
    ageRange: [42, 58],
    weight: 12,
    oncePerRun: true,
    choices: [
      {
        id: 'c-change-lifestyle',
        text: '彻底整改作息，放权休养，积极锻炼',
        effects: {
          statChanges: { health: 18, stress: -20, wealth: -10 },
          addFlags: ['health-conscious'],
        },
      },
      {
        id: 'c-ignore-work',
        text: '正值事业攻坚期，吃药硬扛继续冲刺',
        effects: {
          statChanges: { health: -20, wealth: 50, stress: 15 },
          addFlags: ['chronic-exhaustion'],
        },
      },
    ],
  },
  {
    id: 'event-senior-legacy',
    title: '岁月沉淀与晚年回望',
    description: '年逾花甲，回望自己几十载走过的人生长路，儿孙与门生围坐一堂。',
    ageRange: [65, 80],
    weight: 15,
    oncePerRun: true,
    choices: [
      {
        id: 'c-mentor-youth',
        text: '设立青年扶持基金，提携后进',
        effects: {
          statChanges: { reputation: 25, wealth: -30, charisma: 15 },
          addMemory: { type: 'respected-elder', tags: ['legacy', 'honor'] },
        },
      },
      {
        id: 'c-peaceful-garden',
        text: '归隐田园花草，安享天伦之乐',
        effects: {
          statChanges: { health: 10, stress: -25 },
        },
      },
    ],
  },
]
