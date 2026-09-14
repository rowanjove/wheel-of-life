/**
 * 世界沉浸文本与本地化文案字典 (World Lexicon)
 * 根据不同世界的调性（古代江湖、古代修仙、现代都市）定制专属 UI 术语与沉浸叙事。
 */

export interface WorldLexicon {
  creation: {
    title: string
    subtitle: string
    worldSectionTitle: string
    identitySectionTitle: string
    namePlaceholder: string
    talentsSectionTitle: string
    talentsSubtitle: string
    statsSectionTitle: string
    statsSubtitle: string
    startButton: string
  }
  wheel: {
    eyebrow: string
    title: string
    hint: string
    spinReadyText: string
    spinningText: string
  }
  modal: {
    categoryLabels: Record<string, string>
    choiceHeading: string
    resultBadge: string
    defaultFeedback: string
    continueButton: string
  }
  hud: {
    statsTab: string
    traitsTab: string
    inventoryTab: string
    historyTab: string
    ageUnit: string
    timeUnit: string
  }
  ending: {
    tag: string
    defaultTitle: string
    ageLabel: string
    timeLabel: string
    historyLabel: string
    inventoryLabel: string
    restartButton: string
  }
}

const wuxiaLexicon: WorldLexicon = {
  creation: {
    title: '江 湖 谱 牒 · 投 胎 问 卦',
    subtitle: '天地逆旅，百代过客。江湖路远，且卜你今生根骨家世与武学福缘。',
    worldSectionTitle: '一、选择降生时空',
    identitySectionTitle: '二、大侠尊名与门第家世',
    namePlaceholder: '大侠尊姓大名（如：沈炼、林孤萍）',
    talentsSectionTitle: '三、本命武学根骨（六选三）',
    talentsSubtitle: '生来身怀的奇经八脉与武学机缘，影响江湖立足之本',
    statsSectionTitle: '四、先天筋骨悟性分配',
    statsSubtitle: '分配你的先天潜质，决定初始武道根基',
    startButton: '策 马 踏 入 江 湖',
  },
  wheel: {
    eyebrow: '江 湖 宿 命 · 命 途 轮 盘',
    title: '拨动江湖风云之轮',
    hint: '人在江湖，身不由己。一饮一啄莫非前定，刀剑恩仇由天由己。',
    spinReadyText: '起卦行路',
    spinningText: '风云变幻…',
  },
  modal: {
    categoryLabels: {
      daily: '江湖琐事',
      growth: '武道精进',
      wealth: '盘缠生计',
      crisis: '生死大劫',
      opportunity: '旷世奇遇',
      character: '恩怨豪侠',
      special: '武林异象',
    },
    choiceHeading: '刀光剑影当前，你将如何应对？',
    resultBadge: '【江湖定数】',
    defaultFeedback: '江湖风云变幻，因果皆成过往。',
    continueButton: '收 剑 入 鞘 · 继 续 前 行',
  },
  hud: {
    statsTab: '身手筋骨',
    traitsTab: '武学造诣',
    inventoryTab: '江湖行囊',
    historyTab: '江湖风云录',
    ageUnit: '岁',
    timeUnit: '年',
  },
  ending: {
    tag: '江 湖 绝 唱',
    defaultTitle: '笑傲红尘',
    ageLabel: '享寿',
    timeLabel: '历练风霜',
    historyLabel: '武林大事',
    inventoryLabel: '随身兵刃',
    restartButton: '再 入 江 湖 · 重 启 传 奇',
  },
}

const xianxiaLexicon: WorldLexicon = {
  creation: {
    title: '天 道 轮 回 · 宿 命 转 生',
    subtitle: '尘缘未了，灵台重开。溯因果之源，塑今世长生仙根与命格福地。',
    worldSectionTitle: '一、选择飞升界域',
    identitySectionTitle: '二、道友道号与仙缘血脉',
    namePlaceholder: '道友尊讳道号（如：叶清歌、顾长生）',
    talentsSectionTitle: '三、先天灵根与大宿命（六选三）',
    talentsSubtitle: '天道赐予的独门命数与五行灵机，左右仙凡之别',
    statsSectionTitle: '四、先天道基灵质分配',
    statsSubtitle: '塑炼神识根骨，奠定吐纳长生之基',
    startButton: '逆 天 踏 上 仙 途',
  },
  wheel: {
    eyebrow: '天 道 冥 冥 · 造 化 轮 盘',
    title: '转动天道因果之轮',
    hint: '大道三千，福祸相依。顺为凡，逆为仙，全在造化一念间。',
    spinReadyText: '感应天道',
    spinningText: '因果推演…',
  },
  modal: {
    categoryLabels: {
      daily: '打坐吐纳',
      growth: '道行突破',
      wealth: '灵石资粮',
      crisis: '天魔心劫',
      opportunity: '仙府古泽',
      character: '宗门同道',
      special: '天地异数',
    },
    choiceHeading: '仙途莫测，请依道心定夺：',
    resultBadge: '【天道因果落定】',
    defaultFeedback: '天道悠悠，因果业力随风流转。',
    continueButton: '参 悟 天 道 · 继 续 仙 途',
  },
  hud: {
    statsTab: '道基灵质',
    traitsTab: '仙根宿慧',
    inventoryTab: '须弥储物',
    historyTab: '道途仙历',
    ageUnit: '载',
    timeUnit: '纪年',
  },
  ending: {
    tag: '仙 途 终 局',
    defaultTitle: '羽化登仙',
    ageLabel: '道龄',
    timeLabel: '苦修岁月',
    historyLabel: '参悟大事',
    inventoryLabel: '本命法宝',
    restartButton: '再 入 轮 回 · 重 铸 仙 骨',
  },
}

const modernLexicon: WorldLexicon = {
  creation: {
    title: '人 生 重 启 · 降 生 规 划',
    subtitle: '时代列车呼啸向前，选择你的起点与天赋特长，开启崭新当代人生。',
    worldSectionTitle: '一、选择所处时代',
    identitySectionTitle: '二、个人姓名与家庭起点',
    namePlaceholder: '你的姓名（如：张明、苏晓）',
    talentsSectionTitle: '三、天资特长与爱好（六选三）',
    talentsSubtitle: '生来具备的潜能特长，助力职场与生活道路',
    statsSectionTitle: '四、初始能力分配',
    statsSubtitle: '分配智力体魄，定制你的综合素质',
    startButton: '踏 入 当 代 人 生',
  },
  wheel: {
    eyebrow: '时 代 浪 潮 · 际 遇 轮 盘',
    title: '转动人生选择之轮',
    hint: '人生的每一次转动与抉择，都在悄然谱写着独一无二的成长轨迹。',
    spinReadyText: '转动人生',
    spinningText: '岁月流转…',
  },
  modal: {
    categoryLabels: {
      daily: '生活日常',
      growth: '学业技能',
      wealth: '职场财富',
      crisis: '突发意外',
      opportunity: '人生风口',
      character: '社交人脉',
      special: '时代际遇',
    },
    choiceHeading: '面对生活的抉择，你的选择是：',
    resultBadge: '【生活尘埃落定】',
    defaultFeedback: '生活的齿轮向前滚动，留下了岁月印记。',
    continueButton: '调 整 心 态 · 继 续 前 行',
  },
  hud: {
    statsTab: '个人能力',
    traitsTab: '性格天资',
    inventoryTab: '随身物品',
    historyTab: '成长履历',
    ageUnit: '岁',
    timeUnit: '年',
  },
  ending: {
    tag: '人 生 终 篇',
    defaultTitle: '人生圆满',
    ageLabel: '享年',
    timeLabel: '历经岁月',
    historyLabel: '大事留痕',
    inventoryLabel: '积累遗存',
    restartButton: '重 启 人 生 · 再 活 一 次',
  },
}

const lexiconMap: Record<string, WorldLexicon> = {
  wuxia: wuxiaLexicon,
  xianxia: xianxiaLexicon,
  modern: modernLexicon,
}

export function getWorldLexicon(worldId: string): WorldLexicon {
  return lexiconMap[worldId] ?? wuxiaLexicon
}
