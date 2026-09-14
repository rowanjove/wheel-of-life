import type { WorldPack } from '../packTypes'

export const wuxiaWorldPack: WorldPack = {
  manifest: {
    id: 'wuxia',
    name: '江湖风云',
    version: '2.0.0',
    engineVersion: '2.0.0',
    description: '刀光剑影，恩怨情仇。人在江湖，身不由己，转动命运之轮书写属于你的侠客传奇。',
    author: 'Wheel of Life Team',
    wheelMode: 'single',
    initialPoints: 25,
    tone: '传统武侠豪气',
    entry: 'index.ts',
    stages: [
      { id: 'apprentice', name: '习武学徒', minAge: 0, maxAge: 15 },
      { id: 'young-swordsman', name: '初入江湖', minAge: 16, maxAge: 29 },
      { id: 'established', name: '名扬四海', minAge: 30, maxAge: 55 },
      { id: 'grandmaster', name: '一代名宿', minAge: 56, maxAge: 120 },
    ],
  },
  stats: [
    { id: 'physique', name: '体魄', min: 0, max: 100, initial: 10, description: '筋骨力量与耐力根基' },
    { id: 'intellect', name: '悟性', min: 0, max: 100, initial: 10, description: '武学参悟与招式推演能力' },
    { id: 'mentality', name: '心性', min: 0, max: 100, initial: 10, description: '心魔定力与坚韧意志' },
    { id: 'charisma', name: '魅力', min: 0, max: 100, initial: 10, description: '江湖仪态与人脉交情' },
    { id: 'luck', name: '气运', min: 0, max: 100, initial: 10, description: '命途机缘与福祸造化' },
    { id: 'health', name: '气血', min: 0, max: 100, initial: 80, isStatus: true, description: '生命元气与内伤状态' },
    { id: 'silver', name: '银两', min: 0, max: 10000, initial: 10, isStatus: true, description: '盘缠银钱' },
    { id: 'reputation', name: '江湖声望', min: 0, max: 100, initial: 0, isStatus: true, description: '武林威名与名宿敬仰' },
  ],
  talents: [
    { id: 't-wuxia-bones', name: '骨骼惊奇', description: '筋骨天生异于常人，体魄+15', rarity: 2, modifiers: [{ target: 'stat', key: 'physique', value: 15 }] },
    { id: 't-wuxia-sword-heart', name: '剑心通明', description: '参悟剑道极快，悟性+15', rarity: 3, modifiers: [{ target: 'stat', key: 'intellect', value: 15 }] },
    { id: 't-wuxia-poison-immune', name: '百毒不侵', description: '幼年误食朱果，寻常瘴气剧毒难伤分毫', rarity: 3 },
    { id: 't-wuxia-fate', name: '福缘深厚', description: '气运+20，奇遇古墓事件概率增加', rarity: 2, modifiers: [{ target: 'stat', key: 'luck', value: 20 }] },
    { id: 't-wuxia-rebel', name: '桀骜反骨', description: '心性独特，对正邪之辨有独到见解', rarity: 1, modifiers: [{ target: 'stat', key: 'mentality', value: 10 }] },
  ],
  traits: [
    { id: 'tr-wuxia-swordsman', name: '剑术小成', description: '剑招已有几分锋芒' },
    { id: 'tr-wuxia-drunkard', name: '痛饮狂生', description: '千杯不醉，酒后剑法更添三分狂气' },
    { id: 'tr-wuxia-rookie', name: '初露锋芒', description: '初涉武林，年轻一代瞩目后生' },
    { id: 'tr-wuxia-master', name: '一代宗师', description: '自创门派招式，名动大江南北' },
    { id: 'tr-wuxia-hermit', name: '笑傲隐士', description: '厌倦江湖恩怨，寄情山水' },
  ],
  items: [
    { id: 'item-iron-sword', name: '青锋佩剑', description: '百炼精钢打造，锋锐无匹', type: 'equipment' },
    { id: 'item-secret-scroll', name: '太玄残卷', description: '古战场遗留的上乘功法残页', type: 'key' },
    { id: 'item-healing-pill', name: '九转金疮药', description: '止血生肌，快速稳定内伤', type: 'consumable' },
    { id: 'item-hero-token', name: '武林英雄帖', description: '参与武林大比与各大门派盛会的信物', type: 'key' },
  ],
  origins: [
    {
      id: 'origin-martial-hall',
      name: '武馆学徒',
      description: '自幼在城中武馆随师父扎马步打熬筋骨，练就一身硬功夫。',
      initialStats: { physique: 18, intellect: 8, mentality: 10, charisma: 8, luck: 8, health: 85, silver: 5, reputation: 5 },
      initialTraits: ['tr-wuxia-rookie'],
      initialItems: ['item-iron-sword'],
    },
    {
      id: 'origin-scholar-son',
      name: '落魄书香',
      description: '祖上曾是官宦名士，虽家道中落，但满腹经纶通晓文史。',
      initialStats: { physique: 8, intellect: 20, mentality: 12, charisma: 14, luck: 10, health: 75, silver: 15, reputation: 0 },
      initialTraits: [],
    },
  ],
  factions: [
    { id: 'fac-wuxia-righteous', name: '正道八大门派', description: '武林名门正宗领袖' },
    { id: 'fac-wuxia-devil', name: '九幽教', description: '行事狠辣诡谲的异派巨擘' },
    { id: 'fac-wuxia-court', name: '六扇门', description: '维持朝廷法度与捕盗缉凶的官府力量' },
  ],
  events: [
    {
      id: 'ev-wuxia-basic-training',
      title: '筑基扎马·寒暑苦功',
      text: '从拂晓至日暮，你在梅花桩与沙袋前挥汗如雨，稳扎稳打磨砺筋骨。',
      category: 'growth',
      conditions: { age: { gte: 0, lte: 16 } },
      probability: { mode: 'static_weight', weight: 40 },
      directEffects: [
        { type: 'modify_stat', key: 'physique', value: 5 },
      ],
    },
    {
      id: 'ev-wuxia-jianghu-wandering',
      title: '仗剑远游·历练红尘',
      text: '一人一马一壶酒，你踏遍五湖四海，惩恶扬善，结识绿林豪杰。',
      category: 'daily',
      conditions: { age: { gte: 17, lte: 60 } },
      probability: { mode: 'static_weight', weight: 35 },
      directEffects: [
        { type: 'modify_stat', key: 'reputation', value: 5 },
        { type: 'modify_stat', key: 'silver', value: 8 },
      ],
    },
    {
      id: 'ev-wuxia-mountain-meditation',
      title: '深谷结庐·静悟天道',
      text: '你在幽谷深山结庐而居，听松涛抚琴，坐忘心法，武学造诣日臻化境。',
      category: 'growth',
      conditions: { age: { gte: 50, lte: 100 } },
      probability: { mode: 'static_weight', weight: 40 },
      directEffects: [
        { type: 'modify_stat', key: 'mentality', value: 8 },
        { type: 'modify_stat', key: 'intellect', value: 5 },
      ],
    },
    {
      id: 'ev-wuxia-master-test',
      title: '深山古刹拜师学艺',
      text: '十六岁那年，你独自登上终南山玄岳峰，求见名震江湖的青松道长。',
      category: 'growth',
      conditions: { age: { gte: 15, lte: 18 } },
      probability: { mode: 'static_weight', weight: 80 },
      oncePerRun: true,
      options: [
        {
          id: 'opt-sword-path',
          text: '执意修行凌厉青松剑法',
          branches: [
            {
              check: { stat: 'intellect', difficulty: 15 },
              text: '你悟性极高，道长微微颔首，传你本门至高心诀！',
              effects: [
                { type: 'modify_stat', key: 'intellect', value: 15 },
                { type: 'add_trait', traitId: 'tr-wuxia-swordsman' },
                { type: 'add_item', itemId: 'item-iron-sword', name: '师门青锋佩剑' },
              ],
            },
            {
              text: '道长见你心志尚需磨砺，命你先入后山挑水劈柴三年。',
              effects: [
                { type: 'modify_stat', key: 'physique', value: 10 },
                { type: 'modify_stat', key: 'mentality', value: 10 },
              ],
            },
          ],
        },
        {
          id: 'opt-inner-path',
          text: '潜修纯阳内家吐纳功',
          effects: [
            { type: 'modify_stat', key: 'health', value: 20 },
            { type: 'modify_stat', key: 'mentality', value: 15 },
          ],
        },
      ],
    },
    {
      id: 'ev-wuxia-inn-encounter',
      title: '风雨客栈偶遇重伤侠士',
      text: '暴雨倾盆的夜里，客栈破门被撞开，一名浑身血迹的白衣剑客跌进门槛，怀中紧紧抱着一卷油布包裹。',
      category: 'character',
      conditions: { age: { gte: 18 } },
      probability: { mode: 'static_weight', weight: 50 },
      options: [
        {
          id: 'opt-save-him',
          text: '施以援手，为其敷药疗伤',
          branches: [
            {
              condition: { item: 'item-healing-pill' },
              text: '你取出珍贵的金疮药为他止血，剑客感激涕零，将包裹中的秘籍残卷相赠！',
              effects: [
                { type: 'remove_item', itemId: 'item-healing-pill' },
                { type: 'add_item', itemId: 'item-secret-scroll', name: '赠予的秘籍残卷' },
                { type: 'modify_stat', key: 'reputation', value: 10 },
                { type: 'add_memory', memoryType: 'saved_wandering_swordsman', tags: ['gratitude', 'swordsman'] },
              ],
            },
            {
              text: '你连夜奔波寻来草药止住他的伤势，侠士抱拳道谢，许下他日必报之诺。',
              effects: [
                { type: 'modify_stat', key: 'reputation', value: 5 },
                { type: 'add_memory', memoryType: 'saved_wandering_swordsman', tags: ['gratitude'] },
              ],
            },
          ],
        },
        {
          id: 'opt-ignore',
          text: '事不关己，低头继续饮酒',
          effects: [{ type: 'modify_stat', key: 'mentality', value: 2 }],
        },
      ],
    },
    {
      id: 'ev-wuxia-tournament',
      title: '武林大会问鼎天下',
      text: '五年一度的武林大会在嵩山绝顶召开，群雄毕至，四海高手云集，擂鼓雷鸣！',
      category: 'opportunity',
      conditions: { age: { gte: 25 }, stat: 'physique', op: '>=', value: 30 },
      probability: {
        mode: 'dynamic_weight',
        baseWeight: 30,
        modifiers: [
          {
            source: '声望大于30名动江湖',
            condition: { status: 'reputation', op: '>=', value: 30 },
            mode: 'multiply',
            value: 2.0,
          },
        ],
      },
      options: [
        {
          id: 'opt-fight-top',
          text: '飞身跃上擂台，迎战各路成名豪杰',
          branches: [
            {
              check: { stat: 'physique', difficulty: 45 },
              text: '你在擂台上连败三位成名门派长老，全场群雄肃然起敬，武林盟主亲授英雄令！',
              effects: [
                { type: 'modify_stat', key: 'reputation', value: 40 },
                { type: 'add_trait', traitId: 'tr-wuxia-master' },
                { type: 'add_item', itemId: 'item-hero-token', name: '至尊盟主令' },
              ],
            },
            {
              text: '激战百合后气力略有不逮，虽败犹荣，依然赢得了全场喝彩。',
              effects: [
                { type: 'modify_stat', key: 'reputation', value: 15 },
                { type: 'modify_stat', key: 'health', value: -10 },
              ],
            },
          ],
        },
        {
          id: 'opt-watch',
          text: '在台下静观群雄过招，体悟各派招式短长',
          effects: [{ type: 'modify_stat', key: 'intellect', value: 10 }],
        },
      ],
    },
    {
      id: 'ev-wuxia-legend-ending',
      title: '登峰造极·武林神话',
      text: '你的武功已参天地造化，独孤天下，再无敌手。你放下手中之剑，漫步走向苍茫云海。',
      category: 'special',
      conditions: { stat: 'reputation', op: '>=', value: 60, age: { gte: 40 } },
      probability: { mode: 'static_weight', weight: 20 },
      oncePerRun: true,
      directEffects: [
        {
          type: 'trigger_ending',
          endingId: 'ending-wuxia-grandmaster',
          reason: '一代宗师，笑傲江湖，青史流芳。',
        },
      ],
    },
  ],
  endings: [
    {
      id: 'ending-wuxia-grandmaster',
      title: '一代宗师·剑绝古今',
      description: '你的名字成为了江湖中不朽的传说，后辈剑客奉你为天人剑祖。',
      category: 'legend',
      conditions: { stat: 'reputation', op: '>=', value: 60 },
      rarity: 4,
    },
  ],
}
