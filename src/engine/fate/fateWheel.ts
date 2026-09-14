import type { CharacterState } from '../core/model'

export interface FateOption {
  id: string
  name: string
  description: string
  weight: number
  color?: string
  apply: (character: CharacterState) => CharacterState
}

export interface FateCeremony {
  id: string
  title: string
  description: string
  options: FateOption[]
}

export function spinFateWheel(
  ceremony: FateCeremony,
  nextRng: () => number,
  character: CharacterState,
): { selectedOption: FateOption; updatedCharacter: CharacterState } {
  const options = ceremony.options
  if (options.length === 0) {
    throw new Error(`FateCeremony '${ceremony.id}' has no options.`)
  }

  const totalWeight = options.reduce((sum, opt) => sum + Math.max(0.0001, opt.weight), 0)
  let cursor = nextRng() * totalWeight

  let selectedOption = options[options.length - 1]
  for (const opt of options) {
    const weight = Math.max(0.0001, opt.weight)
    if (cursor <= weight) {
      selectedOption = opt
      break
    }
    cursor -= weight
  }

  const updatedCharacter = selectedOption.apply(character)

  // Record into life history
  const historyEntry = {
    age: updatedCharacter.age,
    year: updatedCharacter.currentYear,
    title: `命运时刻：${ceremony.title} -> ${selectedOption.name}`,
    description: selectedOption.description,
    type: 'wheel' as const,
  }

  return {
    selectedOption,
    updatedCharacter: {
      ...updatedCharacter,
      history: [...updatedCharacter.history, historyEntry],
    },
  }
}

/**
 * 预设现代人生关键命运轮盘：
 * 1. 少年命运：中高考/人生航向转折
 * 2. 青年突破：重大机遇风口
 * 3. 中年危机：时代剧变/健康关卡
 */
export function createModernFateCeremonies(): Record<string, FateCeremony> {
  return {
    'fate-adolescent': {
      id: 'fate-adolescent',
      title: '少年航向：关键升学与志向',
      description: '命运的齿轮在十六岁转动，一次意料之外的际遇重塑了你的专注领域。',
      options: [
        {
          id: 'opt-academic-scholar',
          name: '保送名校拔尖计划',
          description: '因特长斩获顶尖重点名校预录取资格。',
          weight: 15,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, knowledge: (c.stats.knowledge ?? 0) + 25, reputation: (c.stats.reputation ?? 0) + 15 },
            flags: [...c.flags, 'top-univ-grad'],
          }),
        },
        {
          id: 'opt-practical-major',
          name: '踏入热门应用工科',
          description: '选择当下就业最抢手、技术最扎实的工程赛道。',
          weight: 45,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, knowledge: (c.stats.knowledge ?? 0) + 15, wealth: (c.stats.wealth ?? 0) + 10 },
            flags: [...c.flags, 'engineering-major'],
          }),
        },
        {
          id: 'opt-arts-comm',
          name: '拥抱商科与人文传播',
          description: '投身视野宏阔的商业贸易与公关传播行业。',
          weight: 30,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, charisma: (c.stats.charisma ?? 0) + 20, reputation: (c.stats.reputation ?? 0) + 10 },
            flags: [...c.flags, 'biz-humanities'],
          }),
        },
        {
          id: 'opt-early-adventurer',
          name: '自主游历社会大学',
          description: '不走寻常路，尽早扎入市场江湖磨砺韧劲。',
          weight: 10,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, charisma: (c.stats.charisma ?? 0) + 15, wealth: (c.stats.wealth ?? 0) + 20, stress: (c.stats.stress ?? 0) + 10 },
            flags: [...c.flags, 'self-made-path'],
          }),
        },
      ],
    },
    'fate-crisis': {
      id: 'fate-crisis',
      title: '人生关卡：风口与考验',
      description: '人到中流击水，时代浪潮与突发变局考验着你的定力与抉择。',
      options: [
        {
          id: 'opt-crisis-leap',
          name: '绝处逢生，逆风翻盘',
          description: '敏锐识别行业变革，借势实现跨阶层飞跃。',
          weight: 20,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, wealth: (c.stats.wealth ?? 0) + 120, reputation: (c.stats.reputation ?? 0) + 25 },
            flags: [...c.flags, 'industry-leader'],
          }),
        },
        {
          id: 'opt-crisis-steady',
          name: '稳字当头，平稳避险',
          description: '谨慎收缩资产与精力，安然渡过行业寒冬。',
          weight: 55,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, stress: Math.max(0, (c.stats.stress ?? 0) - 10), health: (c.stats.health ?? 0) + 5 },
          }),
        },
        {
          id: 'opt-crisis-loss',
          name: '受挫交学费，磨砺心智',
          description: '遭遇财务小幅回撤，但淬炼出愈挫愈勇的强大心理。',
          weight: 25,
          apply: (c) => ({
            ...c,
            stats: { ...c.stats, wealth: Math.max(0, (c.stats.wealth ?? 0) - 25), knowledge: (c.stats.knowledge ?? 0) + 10 },
            traits: [...c.traits, 'trait-resilient'],
          }),
        },
      ],
    },
  }
}
