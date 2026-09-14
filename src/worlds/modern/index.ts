import type { WorldPack } from '../packTypes'

export const modernWorldPack: WorldPack = {
  manifest: {
    id: 'modern',
    name: '当代人生',
    version: '2.0.0',
    engineVersion: '2.0.0',
    description: '一个普通人在现代社会中的真实人生，充满抉择、未知、奋斗与命运的交织。',
    author: 'Wheel of Life Team',
    wheelMode: 'single',
    initialPoints: 20,
    tone: '现实生活与黑色幽默',
    entry: 'index.ts',
    stages: [
      { id: 'infancy', name: '幼年', minAge: 0, maxAge: 5 },
      { id: 'childhood', name: '童年', minAge: 6, maxAge: 11 },
      { id: 'adolescence', name: '少年', minAge: 12, maxAge: 17 },
      { id: 'youth', name: '青年', minAge: 18, maxAge: 29 },
      { id: 'adulthood', name: '中年', minAge: 30, maxAge: 59 },
      { id: 'elderly', name: '暮年', minAge: 60, maxAge: 120 },
    ],
  },
  stats: [
    { id: 'health', name: '健康', min: 0, max: 100, initial: 85, isStatus: true, description: '身体素质与生命体征' },
    { id: 'knowledge', name: '学识', min: 0, max: 100, initial: 15, description: '文化修养与专业技能' },
    { id: 'wealth', name: '财富', min: 0, max: 100000, initial: 10, isStatus: true, description: '可支配资金与资产' },
    { id: 'charisma', name: '魅力', min: 0, max: 100, initial: 50, description: '情商、亲和力与社会吸引力' },
    { id: 'stress', name: '压力', min: 0, max: 100, initial: 10, isStatus: true, description: '身心负荷，过高可能诱发疾病' },
  ],
  talents: [
    { id: 't-mod-smart', name: '天资聪颖', description: '学识成长加快，知识类检定+5', rarity: 2, checkBonuses: { knowledge: 5 } },
    { id: 't-mod-rich', name: '家境殷实', description: '初始财富+80，提前开启投资选项', rarity: 3, modifiers: [{ target: 'stat', key: 'wealth', value: 80 }] },
    { id: 't-mod-athlete', name: '运动健将', description: '健康上限+15，体魄类事件收益提高', rarity: 2, modifiers: [{ target: 'stat', key: 'health', value: 15 }] },
    { id: 't-mod-social', name: '社交达人', description: '魅力+20，人脉与合作事件概率增加', rarity: 2, modifiers: [{ target: 'stat', key: 'charisma', value: 20 }] },
    { id: 't-mod-lucky', name: '锦鲤附体', description: '幸运机缘事件概率大幅提升', rarity: 3 },
    { id: 't-mod-tech', name: '极客直觉', description: '对科技敏感，计算机与工程分支检定有优势', rarity: 2 },
    { id: 't-mod-calm', name: '泰然处之', description: '心态平和，压力增长减少50%', rarity: 2 },
    { id: 't-mod-art', name: '艺术感知', description: '拥有出众的审美与创意直觉', rarity: 1 },
    { id: 't-mod-hustler', name: '商业嗅觉', description: '善于捕捉市场交易与创业机遇', rarity: 3 },
    { id: 't-mod-resilient', name: '韧性生长', description: '遭遇人生逆境时不会轻易崩溃', rarity: 2 },
  ],
  traits: [
    { id: 'tr-mod-curious', name: '求知若渴', description: '对新鲜事物充满好奇心' },
    { id: 'tr-mod-cautious', name: '谨慎行事', description: '走稳健路线，减少危机发生率' },
    { id: 'tr-mod-insomnia', name: '熬夜冠军', description: '夜生活丰富，但微量损耗健康' },
    { id: 'tr-mod-coffee', name: '咖啡依赖', description: '每日必需两杯咖啡维持清醒' },
    { id: 'tr-mod-frugal', name: '勤俭持家', description: '善于省钱，生活开销更低' },
    { id: 'tr-mod-burnout', name: '职场倦怠', description: '对日常工作产生明显疲惫感' },
    { id: 'tr-mod-mortgage', name: '房贷在身', description: '每月需要偿还固定月供' },
    { id: 'tr-mod-veteran', name: '职场骨干', description: '在行业内积累了扎实口碑与经验' },
    { id: 'tr-mod-pioneer', name: '行业领袖', description: '受人尊敬的行业代表人物' },
    { id: 'tr-mod-stock-expert', name: '投资达人', description: '对金融市场有深刻洞察' },
    { id: 'tr-mod-fitness', name: '自律健身', description: '长期保持运动习惯' },
    { id: 'tr-mod-married', name: '步入婚姻', description: '有了携手相伴的人生伴侣' },
    { id: 'tr-mod-parent', name: '为人父母', description: '肩负抚育下一代的责任' },
    { id: 'tr-mod-retired', name: '安享退休', description: '告别职场，享受闲暇晚年' },
    { id: 'tr-mod-optimist', name: '乐观主义', description: '凡事总能看到积极一面' },
    { id: 'tr-mod-philanthropist', name: '慈善先锋', description: '乐善好施，声望斐然' },
    { id: 'tr-mod-academic-star', name: '学术新星', description: '在专业领域发表过重量级论文' },
    { id: 'tr-mod-street-smart', name: '社会大学', description: '深谙人情世故与现实潜规则' },
    { id: 'tr-mod-cat-owner', name: '有猫一族', description: '吸猫解千愁，压力缓解' },
    { id: 'tr-mod-workaholic', name: '工作狂人', description: '事业心极强，不舍昼夜' },
  ],
  items: [
    { id: 'item-laptop', name: '笔记本电脑', description: '办公与探索网络世界的工具', type: 'equipment' },
    { id: 'item-diploma', name: '毕业证书', description: '正规高等教育学位凭证', type: 'key' },
    { id: 'item-house-deed', name: '房产证', description: '属于自己的城市安居之所', type: 'collectible' },
    { id: 'item-car-key', name: '代步轿车', description: '日常通勤与出游座驾', type: 'equipment' },
    { id: 'item-gym-card', name: '健身年卡', description: '偶尔会想起来去打卡的卡片', type: 'consumable' },
    { id: 'item-health-check', name: '全身体检报告', description: '了解身体各项健康指标', type: 'material' },
    { id: 'item-old-photo', name: '泛黄的老照片', description: '封存着童年温暖的回忆', type: 'collectible' },
    { id: 'item-stock-account', name: '证券交易账户', description: '参与金融市场起伏的凭证', type: 'key' },
    { id: 'item-noise-cancelling', name: '降噪耳机', description: '在喧嚣城市中留出一片宁静', type: 'equipment' },
    { id: 'item-startup-plan', name: '商业企划案', description: '饱含激情的创业蓝图草案', type: 'material' },
  ],
  origins: [
    {
      id: 'origin-working-class',
      name: '工薪平民',
      description: '出生在普通的双职工家庭，父母勤恳工作，生活朴素踏实。',
      initialStats: { health: 85, knowledge: 15, wealth: 10, charisma: 50, stress: 5 },
      initialTraits: ['tr-mod-frugal'],
      initialFlags: ['origin-working'],
    },
    {
      id: 'origin-business-family',
      name: '经商家境',
      description: '家庭经商有成，自幼见识商场往来，人脉与资金支持充盈。',
      initialStats: { health: 80, knowledge: 25, wealth: 120, charisma: 65, stress: 15 },
      initialTraits: ['tr-mod-street-smart'],
      initialFlags: ['origin-business'],
    },
    {
      id: 'origin-academic-family',
      name: '书香门第',
      description: '父母皆从事教育或科研工作，家中书香弥漫，崇尚格物致知。',
      initialStats: { health: 75, knowledge: 40, wealth: 25, charisma: 55, stress: 10 },
      initialTraits: ['tr-mod-curious'],
      initialFlags: ['origin-academic'],
    },
  ],
  factions: [
    { id: 'fac-corporate', name: '商业企业界', description: '各大民营企业与跨国集团网络' },
    { id: 'fac-public', name: '公共事业单位', description: '公务系统、科研所与公立高校' },
    { id: 'fac-community', name: '民间社群', description: '街坊邻里与公益民间组织' },
  ],
  events: [
    {
      id: 'ev-mod-preschool-drawing',
      title: '幼儿抓周',
      text: '一岁生日宴上，长辈在红毯上摆满了各式各样的物件，期待你伸出稚嫩的小手。',
      category: 'daily',
      conditions: { age: { lte: 3 } },
      probability: { mode: 'static_weight', weight: 80 },
      oncePerRun: true,
      options: [
        {
          id: 'opt-pick-book',
          text: '抓起一本带插图的精装书籍',
          effects: [{ type: 'modify_stat', key: 'knowledge', value: 5 }, { type: 'add_flag', flag: 'flag-fond-of-books' }],
        },
        {
          id: 'opt-pick-coin',
          text: '抓起一枚金光闪闪的算盘挂坠',
          effects: [{ type: 'modify_stat', key: 'wealth', value: 5 }, { type: 'add_flag', flag: 'flag-money-affinity' }],
        },
        {
          id: 'opt-pick-toy',
          text: '欢快地抱起一把木质小刀剑',
          effects: [{ type: 'modify_stat', key: 'health', value: 5 }, { type: 'add_flag', flag: 'flag-active-play' }],
        },
      ],
    },
    {
      id: 'ev-mod-school-study',
      title: '书山求索·学堂时光',
      text: '清晨的校园书声朗朗，你专注于书本与课堂，吸收着新知。',
      category: 'growth',
      conditions: { age: { gte: 4, lte: 18 } },
      probability: { mode: 'static_weight', weight: 40 },
      directEffects: [
        { type: 'modify_stat', key: 'knowledge', value: 6 },
      ],
    },
    {
      id: 'ev-mod-daily-work',
      title: '职场奔波·生活沉淀',
      text: '通勤路上人来人往，你在日常的工作与生计中沉淀经验，积蓄财富。',
      category: 'daily',
      conditions: { age: { gte: 19, lte: 60 } },
      probability: { mode: 'static_weight', weight: 35 },
      directEffects: [
        { type: 'modify_stat', key: 'wealth', value: 12 },
        { type: 'modify_status', key: 'stress', value: 3 },
      ],
    },
    {
      id: 'ev-mod-leisure-retirement',
      title: '退休闲适·颐养天年',
      text: '晨起漫步公园，午后品茗阅报，岁月沉淀下只余从容与宁静。',
      category: 'daily',
      conditions: { age: { gte: 61, lte: 100 } },
      probability: { mode: 'static_weight', weight: 40 },
      directEffects: [
        { type: 'modify_stat', key: 'health', value: 2 },
        { type: 'modify_status', key: 'stress', value: -4 },
      ],
    },
    {
      id: 'ev-mod-gaokao',
      title: '高考冲刺抉择',
      text: '高三那年夏天蝉鸣阵阵，黑板上的倒计时逼近个位数，面对志愿规划你做出了决定。',
      category: 'growth',
      conditions: { age: { gte: 17, lte: 19 } },
      probability: { mode: 'static_weight', weight: 100 },
      oncePerRun: true,
      options: [
        {
          id: 'opt-stem',
          text: '报考前沿理工科，刻苦攻关',
          branches: [
            {
              check: { stat: 'knowledge', difficulty: 40 },
              text: '凭借出色的学识，你顺利考取顶尖理工重点院校！',
              effects: [
                { type: 'modify_stat', key: 'knowledge', value: 20 },
                { type: 'add_item', itemId: 'item-diploma', name: '重点大学学士学位证' },
                { type: 'add_flag', flag: 'flag-top-univ' },
              ],
            },
            {
              text: '发挥略有失常，但依然考入普通工科高校。',
              effects: [
                { type: 'modify_stat', key: 'knowledge', value: 10 },
                { type: 'add_item', itemId: 'item-diploma', name: '普通本科毕业证' },
              ],
            },
          ],
        },
        {
          id: 'opt-biz',
          text: '报考经管商科，着眼广阔天地',
          effects: [
            { type: 'modify_stat', key: 'charisma', value: 15 },
            { type: 'modify_stat', key: 'wealth', value: 10 },
            { type: 'add_item', itemId: 'item-diploma', name: '商学院毕业证' },
          ],
        },
      ],
    },
    {
      id: 'ev-mod-first-job',
      title: '初入职场大浪淘沙',
      text: '毕业典礼的狂欢散场，你手握简历走向形形色色的招聘市场。',
      category: 'growth',
      conditions: { age: { gte: 21, lte: 25 }, item: 'item-diploma' },
      probability: { mode: 'static_weight', weight: 90 },
      oncePerRun: true,
      options: [
        {
          id: 'opt-corporate',
          text: '入职知名互联网/科技大厂',
          effects: [
            { type: 'modify_stat', key: 'wealth', value: 30 },
            { type: 'modify_status', key: 'stress', value: 20 },
            { type: 'add_item', itemId: 'item-laptop', name: '工作配发笔记本' },
            { type: 'add_trait', traitId: 'tr-mod-workaholic' },
          ],
        },
        {
          id: 'opt-stable',
          text: '考取基层公共事业单位，追求稳健',
          effects: [
            { type: 'modify_stat', key: 'wealth', value: 15 },
            { type: 'modify_status', key: 'stress', value: -10 },
            { type: 'modify_stat', key: 'health', value: 5 },
            { type: 'add_trait', traitId: 'tr-mod-cautious' },
          ],
        },
        {
          id: 'opt-startup',
          text: '拉上好友自主创业摸爬滚打',
          branches: [
            {
              check: { stat: 'charisma', difficulty: 60 },
              text: '凭借出色情商与敏锐嗅觉，你们拿下首笔种子轮融资！',
              effects: [
                { type: 'modify_stat', key: 'wealth', value: 80 },
                { type: 'add_trait', traitId: 'tr-mod-pioneer' },
              ],
            },
            {
              text: '创业多有维艰，虽交了昂贵学费，但淬炼出无畏勇气。',
              effects: [
                { type: 'modify_stat', key: 'wealth', value: -10 },
                { type: 'add_trait', traitId: 'tr-mod-resilient' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ev-mod-stock-windfall',
      title: '资本市场激流暗涌',
      text: '市场迎来新一轮结构性行情，身边的同事朋友都在热火朝天地讨论新兴赛道。',
      category: 'wealth',
      conditions: { age: { gte: 24 } },
      probability: {
        mode: 'dynamic_weight',
        baseWeight: 25,
        modifiers: [
          {
            source: '持有商业嗅觉天赋',
            condition: { talent: 't-mod-hustler' },
            mode: 'multiply',
            value: 2.0,
          },
        ],
      },
      options: [
        {
          id: 'opt-invest-heavily',
          text: '敏锐进场，把握趋势机遇',
          branches: [
            {
              check: { stat: 'knowledge', difficulty: 55 },
              text: '理智分析估值与基本面，你的投资斩获丰厚回报！',
              effects: [
                { type: 'modify_stat', key: 'wealth', value: 60 },
                { type: 'add_trait', traitId: 'tr-mod-stock-expert' },
              ],
            },
            {
              text: '盲目追高遭遇回调，资产发生小幅回撤。',
              effects: [
                { type: 'modify_stat', key: 'wealth', value: -20 },
                { type: 'modify_status', key: 'stress', value: 15 },
              ],
            },
          ],
        },
        {
          id: 'opt-stay-cash',
          text: '保持冷静，不买看不懂的标的',
          effects: [{ type: 'modify_status', key: 'stress', value: -5 }],
        },
      ],
    },
    {
      id: 'ev-mod-sudden-fever',
      title: '深夜突发急症',
      text: '接连数天的繁重工作拖垮了身体，午夜时分你突发高烧与急性腹痛。',
      category: 'crisis',
      conditions: { age: { gte: 18 } },
      probability: {
        mode: 'dynamic_weight',
        baseWeight: 20,
        modifiers: [
          {
            source: '压力大于50增加生病风险',
            condition: { status: 'stress', op: '>=', value: 50 },
            mode: 'multiply',
            value: 2.0,
          },
        ],
      },
      options: [
        {
          id: 'opt-hospital',
          text: '立即打车前往医院急诊就医',
          effects: [
            { type: 'modify_stat', key: 'wealth', value: -5 },
            { type: 'modify_stat', key: 'health', value: 5 },
            { type: 'modify_status', key: 'stress', value: -10 },
          ],
        },
        {
          id: 'opt-endure',
          text: '硬抗到天亮再去药店买药',
          branches: [
            {
              check: { stat: 'health', difficulty: 70 },
              text: '好在体质扎实，喝下热水睡醒后烧退了。',
              effects: [{ type: 'modify_stat', key: 'health', value: -5 }],
            },
            {
              text: '病情加重演变成支气管炎，不得不住院输液一周。',
              effects: [
                { type: 'modify_stat', key: 'health', value: -20 },
                { type: 'modify_stat', key: 'wealth', value: -15 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ev-mod-peaceful-passing',
      title: '安详辞世，终成圆满',
      text: '白发如霜的你在温暖的阳光下阖上双眸，回忆漫长而丰富的一生，心中只有从容与释然。',
      category: 'special',
      conditions: { age: { gte: 80 } },
      probability: { mode: 'static_weight', weight: 15 },
      oncePerRun: true,
      directEffects: [
        {
          type: 'trigger_ending',
          endingId: 'ending-natural-life',
          reason: '八十余载春秋无悔，寿终正寝于故土。',
        },
      ],
    },
  ],
  endings: [
    {
      id: 'ending-natural-life',
      title: '福寿安康·无憾归途',
      description: '一生历经风雨，行过千山万水，最终在家人的陪伴与岁月馈赠中安详告别。',
      category: 'peaceful',
      conditions: { age: { gte: 80 } },
      rarity: 2,
    },
    {
      id: 'ending-wealthy-tycoon',
      title: '一代巨贾·产业传奇',
      description: '白手起家或商战称雄，铸就广阔产业版图，名字载入当代商业名人录。',
      category: 'success',
      conditions: { stat: 'wealth', op: '>=', value: 300 },
      rarity: 3,
    },
  ],
}
