import type { ContentTalent as Talent } from '../../rewrite/content/types'

type TalentTier = Talent['tier']

function talent(id: string, name: string, tier: TalentTier, description: string): Talent {
  return { id, name, tier, description }
}

export const talentsByTier: Record<TalentTier, Talent[]> = {
  ordinary: [
    talent('resilient-body', '坚韧体魄', 'ordinary', '受伤灵力损失减少50%'),
    talent('perfect-memory', '过目不忘', 'ordinary', '典籍研习效果+50%'),
    talent('natural-fighter', '天生武感', 'ordinary', '战斗事件胜率+10%'),
    talent('peaceful-mind', '平和心境', 'ordinary', '负面事件概率-10%'),
    talent('sensitive-smell', '灵敏嗅觉', 'ordinary', '发现灵骨概率+15%'),
  ],
  good: [
    talent('rapid-cultivation', '疾速修炼', 'good', '所有灵力成长+20%'),
    talent('spirit-affinity', '命器契合', 'good', '命器技能效果+30%'),
    talent('born-leader', '天生领袖', 'good', '组队事件额外+1结果'),
    talent('ancient-inheritance', '古武传承', 'good', '开局解锁一项隐藏技能'),
    talent('ring-affinity', '灵环亲和', 'good', '灵环年份概率整体提升一档'),
  ],
  rare: [
    talent('divine-speed-growth', '神速成长', 'rare', '灵力成长+50%，每次事件额外+2灵力'),
    talent('natural-evolution', '命器进化', 'rare', '每阶段进行一次命器自然升品检测'),
    talent('battle-resonance', '战魂共鸣', 'rare', '与强者战斗失败不扣灵力'),
    talent('talent-manifestation', '天赋具现', 'rare', '先天灵力按双倍参与成长计算'),
    talent('divine-perception', '天境感知', 'rare', '天境事件概率+30%'),
  ],
  divine: [
    talent('legendary-form', '传说之姿', 'divine', '所有转盘概率向好方向偏移10%'),
    talent('spirit-fusion', '命器融合', 'divine', '双命器共鸣技能解锁'),
    talent('defy-fate', '逆天改命', 'divine', '每阶段可重转任意一个转盘一次'),
    talent('divine-protection', '神明庇护', 'divine', '老死结局替换为飞升机缘'),
  ],
  legendary: [
    talent('hero-rival', '时代宿敌', 'legendary', '宿敌互动冷却缩短至1年'),
    talent('wheel-of-fate', '命运之轮', 'legendary', '所有转盘可在同一结果分组内重转'),
    talent('world-observer', '世界观察者', 'legendary', '显示所有扇区确切概率'),
  ],
}
