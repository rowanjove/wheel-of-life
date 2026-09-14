import type { WorldPack } from '../packTypes'

export const xianxiaWorldPack: WorldPack = {
  manifest: {
    id: 'xianxia',
    name: '修仙求道',
    version: '2.0.0',
    engineVersion: '2.0.0',
    description: '天地不仁，以万物为刍狗。逆天改命，吐纳天地灵机，转动命运之轮踏上漫漫长生仙途。',
    author: 'Wheel of Life Team',
    wheelMode: 'single',
    initialPoints: 25,
    tone: '清冷出尘与苍茫浩瀚',
    entry: 'index.ts',
    stages: [
      { id: 'mortal', name: '凡胎稚子', minAge: 0, maxAge: 15 },
      { id: 'qi-refining', name: '炼气吐纳', minAge: 16, maxAge: 40 },
      { id: 'foundation', name: '筑基结丹', minAge: 41, maxAge: 150 },
      { id: 'nascent-soul', name: '元婴化神', minAge: 151, maxAge: 600 },
      { id: 'ascension', name: '渡劫飞升', minAge: 601, maxAge: 1500 },
    ],
  },
  stats: [
    { id: 'root_bone', name: '根骨', min: 0, max: 100, initial: 10, description: '灵根资质与经脉淬炼，影响修炼转化效率' },
    { id: 'comprehension', name: '悟性', min: 0, max: 100, initial: 10, description: '参悟功法道经与天地规则之能' },
    { id: 'spiritual_sense', name: '神识', min: 0, max: 100, initial: 10, description: '神魂感知与精神意志范围' },
    { id: 'mindset', name: '心性', min: 0, max: 100, initial: 10, description: '道心定力与抵御天魔魅惑韧度' },
    { id: 'fortune', name: '气运', min: 0, max: 100, initial: 10, description: '天道冥冥庇佑与秘境福缘机率' },
    { id: 'health', name: '肉身气血', min: 0, max: 100, initial: 80, isStatus: true, description: '肉身机能与内腑元气' },
    { id: 'lifespan', name: '剩余寿元', min: 0, max: 3000, initial: 100, isStatus: true, description: '寿元大限，突破大境界可得天赐寿元' },
    { id: 'spirit_stones', name: '灵石', min: 0, max: 1000000, initial: 10, isStatus: true, description: '修仙界硬通灵资与补气源泉' },
    { id: 'cultivation', name: '修为积累', min: 0, max: 10000, initial: 0, isStatus: true, description: '体内炼化真元法力总量' },
    { id: 'dao_heart', name: '道心稳固', min: 0, max: 100, initial: 80, isStatus: true, description: '道心稳固度，过低易引心魔反噬' },
  ],
  talents: [
    {
      id: 't-xianxia-heavenly-root',
      name: '极品天灵根',
      description: '百脉俱通，亲近五行灵机，根骨+20',
      rarity: 3,
      modifiers: [{ target: 'stat', key: 'root_bone', value: 20 }],
    },
    {
      id: 't-xianxia-dao-heart',
      name: '琉璃道心',
      description: '心无杂念不惹尘埃，心性+20，心魔劫难大幅减轻',
      rarity: 3,
      modifiers: [{ target: 'stat', key: 'mindset', value: 20 }],
    },
    {
      id: 't-xianxia-fortune-child',
      name: '天道眷顾',
      description: '气运深不可测，气运+25，稀有洞府机缘概率倍增',
      rarity: 3,
      modifiers: [{ target: 'stat', key: 'fortune', value: 25 }],
    },
    {
      id: 't-xianxia-alchemist',
      name: '草木有灵',
      description: '精通灵药辨识，灵草采集与丹药炼制收益翻倍',
      rarity: 2,
    },
    {
      id: 't-xianxia-sword-bone',
      name: '先天剑胎',
      description: '骨如神铁心如利刃，悟性+15，御剑决胜千里',
      rarity: 2,
      modifiers: [{ target: 'stat', key: 'comprehension', value: 15 }],
    },
    {
      id: 't-xianxia-reincarnate',
      name: '真仙宿慧',
      description: '隐约留存前世道痕记忆，神识+20',
      rarity: 3,
      modifiers: [{ target: 'stat', key: 'spiritual_sense', value: 20 }],
    },
  ],
  traits: [
    { id: 'tr-xianxia-qi-master', name: '炼气大圆满', description: '周身经脉灵雾缭绕，踏入修真之门' },
    { id: 'tr-xianxia-foundation', name: '筑基真修', description: '灵气化液铸就道基，寿元凭添百载' },
    { id: 'tr-xianxia-golden-core', name: '九转金丹', description: '丹碎成婴在即，名震一方修仙大擘' },
    { id: 'tr-xianxia-nascent-soul', name: '元婴老祖', description: '神魂遁出肉身独立长存，威压一方天地' },
    { id: 'tr-xianxia-demon-taint', name: '心魔缠身', description: '道心动摇受杂念侵染，突破时凶险剧增' },
    { id: 'tr-xianxia-pill-master', name: '妙手丹师', description: '开炉炼丹香飘百里，深受各方求道者追捧' },
    { id: 'tr-xianxia-cloud-wanderer', name: '闲云野鹤', description: '不染宗门派系纠葛，独自行走大千世界' },
  ],
  items: [
    {
      id: 'item-spirit-pill',
      name: '聚灵蕴真丹',
      description: '汲取天地纯净灵力炼就，使用可直接增进修为法力',
      type: 'consumable',
      effects: [{ type: 'modify_stat', key: 'cultivation', value: 30 }],
    },
    {
      id: 'item-foundation-pill',
      name: '天元筑基丹',
      description: '护住灵根脉络的破境神药，大幅提高筑基冲关概率',
      type: 'consumable',
      effects: [
        { type: 'modify_stat', key: 'cultivation', value: 50 },
        { type: 'modify_stat', key: 'dao_heart', value: 10 },
      ],
      eventWeightModifiers: [{ tag: 'breakthrough', multiplier: 2.5 }],
    },
    {
      id: 'item-ancient-slip',
      name: '上古残破玉简',
      description: '记录有失传古修士吐纳心得，探索与悟道机缘加权',
      type: 'key',
      eventWeightModifiers: [{ tag: 'ruins', multiplier: 2.0 }, { category: 'opportunity', multiplier: 1.5 }],
    },
    {
      id: 'item-thunder-wood',
      name: '辟雷金丝木',
      description: '吸纳天地雷劫之力的稀有灵木，天劫来临时庇护肉身',
      type: 'equipment',
      eventWeightModifiers: [{ tag: 'tribulation', multiplier: 0.5 }],
    },
  ],
  origins: [
    {
      id: 'origin-xianxia-village',
      name: '灵脉凡童',
      description: '生于灵气淡薄的山野小村，机缘巧合下捡得修真引气诀。',
      initialStats: { root_bone: 12, comprehension: 10, spiritual_sense: 8, mindset: 12, fortune: 10, health: 85, lifespan: 100, spirit_stones: 2, cultivation: 0, dao_heart: 80 },
      initialItems: ['item-spirit-pill'],
    },
    {
      id: 'origin-xianxia-clan',
      name: '世家庶子',
      description: '出自三百年修仙望族，虽非嫡系，却自幼饱读经阁道书。',
      initialStats: { root_bone: 14, comprehension: 16, spiritual_sense: 12, mindset: 10, fortune: 8, health: 80, lifespan: 100, spirit_stones: 30, cultivation: 10, dao_heart: 75 },
      initialItems: ['item-spirit-pill', 'item-ancient-slip'],
    },
    {
      id: 'origin-xianxia-temple',
      name: '古刹弃婴',
      description: '襁褓时被遗弃于荒山孤观，随老道士晨钟暮鼓清心修持。',
      initialStats: { root_bone: 8, comprehension: 14, spiritual_sense: 16, mindset: 20, fortune: 12, health: 75, lifespan: 100, spirit_stones: 5, cultivation: 5, dao_heart: 95 },
      initialTraits: ['tr-xianxia-cloud-wanderer'],
    },
  ],
  factions: [
    { id: 'fac-xianxia-orthodox', name: '玄天正道太一宗', description: '执掌修仙界牛耳的万年名门' },
    { id: 'fac-xianxia-demonic', name: '幽冥罗刹魔殿', description: '行事狠绝、崇尚弱肉强食的魔修巨擘' },
    { id: 'fac-xianxia-alliance', name: '十方散修联盟', description: '不归属大宗门、互通有无的庞大民间修道群体' },
  ],
  events: [
    {
      id: 'ev-xianxia-meditation',
      title: '深谷结庐·闭关吐纳',
      text: '你在灵气充盈的石室之中合眸静坐，吐纳朝霞紫气。岁月在指缝间悄然流淌。',
      category: 'growth',
      timeCost: 36, // 闭关3年
      probability: { mode: 'static_weight', weight: 40 },
      directEffects: [
        { type: 'modify_stat', key: 'cultivation', value: 25 },
        { type: 'modify_stat', key: 'lifespan', value: -3 },
      ],
    },
    {
      id: 'ev-xianxia-ancient-cave',
      title: '探秘上古修士洞府',
      text: '你在断魂崖深处的雾障后方，察觉到一处若隐若现的古禁制光幕。',
      category: 'opportunity',
      tags: ['ruins'],
      probability: {
        mode: 'dynamic_weight',
        baseWeight: 20,
        modifiers: [
          {
            source: '气运 > 15',
            condition: { stat: 'fortune', op: '>', value: 15 },
            mode: 'multiply',
            value: 1.5,
          },
        ],
      },
      options: [
        {
          id: 'opt-break-seal',
          text: '全力推演破解禁制',
          branches: [
            {
              check: { stat: 'comprehension', difficulty: 18 },
              text: '你参透禁制生克之道，安然入内取得上古丹丸与灵简！',
              effects: [
                { type: 'modify_stat', key: 'cultivation', value: 40 },
                { type: 'modify_stat', key: 'spirit_stones', value: 50 },
                { type: 'add_item', itemId: 'item-ancient-slip', name: '上古残破玉简' },
              ],
            },
            {
              text: '禁制反震引发灵爆，你虽勉强逃出却受了不轻的内伤。',
              effects: [
                { type: 'modify_stat', key: 'health', value: -20 },
                { type: 'modify_stat', key: 'dao_heart', value: -5 },
              ],
            },
          ],
        },
        {
          id: 'opt-leave-quietly',
          text: '自知力有未逮，退后离去',
          effects: [{ type: 'modify_stat', key: 'dao_heart', value: 2 }],
        },
      ],
    },
    {
      id: 'ev-xianxia-foundation-tribulation',
      title: '天雷聚顶·筑基天劫',
      text: '丹田内真元浩荡如江海，头顶苍穹劫云翻滚，紫色天雷轰然欲落！',
      category: 'crisis',
      tags: ['breakthrough', 'tribulation'],
      conditions: {
        all: [
          { stat: 'cultivation', op: '>=', value: 80 },
          { not: { trait: 'tr-xianxia-foundation' } },
        ],
      },
      probability: { mode: 'static_weight', weight: 35 },
      options: [
        {
          id: 'opt-face-tribulation',
          text: '以肉身与法力硬抗雷劫',
          branches: [
            {
              condition: { stat: 'root_bone', op: '>=', value: 25 },
              text: '雷光贯体而不倒！你洗炼铅华，道基铸就，寿元大增百载！',
              effects: [
                { type: 'add_trait', traitId: 'tr-xianxia-foundation' },
                { type: 'modify_stat', key: 'lifespan', value: 120 },
                { type: 'modify_stat', key: 'health', value: 20 },
              ],
            },
            {
              text: '雷威暴烈，你肉身几近崩溃，虽侥幸留得一命却道基受损。',
              effects: [
                { type: 'modify_stat', key: 'health', value: -50 },
                { type: 'modify_stat', key: 'cultivation', value: -20 },
                { type: 'add_trait', traitId: 'tr-xianxia-demon-taint' },
              ],
            },
          ],
        },
        {
          id: 'opt-use-foundation-pill',
          text: '服下筑基神丹护身破境',
          conditions: { item: 'item-foundation-pill' },
          branches: [
            {
              text: '筑基丹药力化作一层温润青光抵挡住雷暴，你顺遂破境登临筑基！',
              effects: [
                { type: 'add_trait', traitId: 'tr-xianxia-foundation' },
                { type: 'modify_stat', key: 'lifespan', value: 150 },
                { type: 'modify_stat', key: 'cultivation', value: 50 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ev-xianxia-demon-temptation',
      title: '域外天魔·梦魇惑心',
      text: '子夜行功之际，虚空中传来靡靡仙乐与红尘幻景，天魔化作至亲故旧诱你散功。',
      category: 'crisis',
      probability: { mode: 'static_weight', weight: 25 },
      options: [
        {
          id: 'opt-resist-demon',
          text: '默诵清静黄庭，坚守本心',
          branches: [
            {
              check: { stat: 'mindset', difficulty: 16 },
              text: '你心如明镜不惹尘埃，天魔尖啸溃散，反化作纯净念力滋养神识！',
              effects: [
                { type: 'modify_stat', key: 'spiritual_sense', value: 5 },
                { type: 'modify_stat', key: 'dao_heart', value: 10 },
              ],
            },
            {
              text: '杂念纷扰，你心神剧震险些走火入魔，一口本命精血喷出。',
              effects: [
                { type: 'modify_stat', key: 'health', value: -25 },
                { type: 'modify_stat', key: 'dao_heart', value: -15 },
              ],
            },
          ],
        },
        {
          id: 'opt-demonic-bargain',
          text: '与天魔做交易，汲取魔气速成',
          effects: [
            { type: 'modify_stat', key: 'cultivation', value: 60 },
            { type: 'modify_stat', key: 'dao_heart', value: -30 },
            { type: 'add_trait', traitId: 'tr-xianxia-demon-taint' },
          ],
        },
      ],
    },
    {
      id: 'ev-xianxia-market-trade',
      title: '仙缘坊市·灵珍争奇',
      text: '云海之巅的万宝商会大开山门，散修与宗门修士云集，法宝灵丹琳琅满目。',
      category: 'daily',
      probability: { mode: 'static_weight', weight: 30 },
      options: [
        {
          id: 'opt-buy-pills',
          text: '消耗 15 灵石购买聚灵蕴真丹',
          conditions: { stat: 'spirit_stones', op: '>=', value: 15 },
          effects: [
            { type: 'modify_stat', key: 'spirit_stones', value: -15 },
            { type: 'add_item', itemId: 'item-spirit-pill', name: '聚灵蕴真丹' },
          ],
        },
        {
          id: 'opt-sell-herbs',
          text: '售卖采摘的灵药换取灵石',
          effects: [{ type: 'modify_stat', key: 'spirit_stones', value: 20 }],
        },
      ],
    },
    {
      id: 'ev-xianxia-lifespan-exhausted',
      title: '天命已尽·油尽灯枯',
      text: '寿元大限已至，任你生前法力通天，肉身机能依旧化为飞灰。',
      category: 'crisis',
      conditions: { stat: 'lifespan', op: '<=', value: 0 },
      probability: { mode: 'forced' },
      directEffects: [
        { type: 'modify_stat', key: 'health', value: -100 },
      ],
    },
  ],
  endings: [
    {
      id: 'ending-xianxia-ascension',
      title: '白日飞升·长生大罗',
      description: '历经九九重劫，褪尽凡胎肉骨，步入仙界天门，成为逍遥天地间的大罗真仙。',
      category: 'legendary',
    },
    {
      id: 'ending-xianxia-decay',
      title: '道消身殒·重归天地',
      description: '大限已至，未能证道长生。万载苦修终作土，化为一抔黄沙滋养后人。',
      category: 'normal',
    },
    {
      id: 'ending-xianxia-tribulation-fall',
      title: '雷劫化灰·万劫不复',
      description: '面对浩瀚天威神罚，身躯与神魂尽被九天神雷撕碎，湮灭于天地虚空之中。',
      category: 'bad',
    },
  ],
}
