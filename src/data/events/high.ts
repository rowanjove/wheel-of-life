import type { ContentGameEvent as GameEvent } from '../../rewrite/content/types'
import { event, flag, item, knowledge, power, relationship, title } from './helpers'

const seeds: Array<[string, string, string, any[]]> = [
  ['elite-pressure', '顶尖精英云集', '天才云集令你奋发修炼。', [power(8)]],
  ['shrek-team', '七星战队战队', '你在大赛遇到传奇带领的七怪。', [{ type: 'hero-unlock' }]],

  ['titled-douluo-visit', '封号灵尊拜访', '封号灵尊选中你进行特训。', [power(15)]],
  ['ten-thousand-bone', '万年灵骨现世', '拍卖会上出现万年灵骨。', [flag('rare-bone-auction')]],
  ['soul-tech', '魂导科技突破', '重大实验使你成为灵导师。', [title('灵导师'), item('高级灵导器')]],
  ['secret-mentor', '秘密师承', '隐世高手秘密指导你。', [flag('mentor-three-years')]],
  ['imperial-politics', '帝国政治漩涡', '你被卷入皇室权力争斗。', [relationship('empire', 8), flag('imperial-side')]],
  ['continent-wander', '大陆漫游', '独自漫游带来两次额外机缘。', [flag('extra-events-2')]],
  ['desperate-insight', '绝境顿悟', '生死关头命器发生质变。', [flag('spirit-evolution-check')]],
  ['ancient-beast', '太古神兽遭遇', '你与神兽对峙并幸存。', [power(10), title('曾与神兽对峙')]],
  ['lover-leaves', '爱人离去', '离别带来痛苦，也带来孤独淬炼。', [power(5), title('孤独淬炼')]],
  ['cross-world', '跨界修行', '异域修行拓展命器兼容性。', [flag('cross-world-compatible')]],
  ['ancestor', '神秘老祖', '家族老祖传授不传之秘。', [knowledge('家族秘技')]],
  ['divine-ruins', '天境遗迹探索', '遗迹深处有神级灵骨的气息。', [flag('roll-divine-bone-20')]],
  ['tang-wedding', '传奇大婚消息', '消息传遍大陆，天境时代将临。', [flag('ascension-preparation')]],
  ['beast-war', '灵兽大战', '你全力参加星渊森林大战。', [power(20), flag('tiny-bone-chance')]],
  ['teacher-secret', '教师的秘密', '你揭穿了圣殿卧底。', [relationship('sanctuary', -10), relationship('reputation', 8)]],
  ['contest-diplomacy', '全陆赛事外交', '你代表学院出访他国。', [relationship('empire', 8), relationship('reputation', 5)]],
  ['mental-realm', '精神幻境', '你在命器精神世界中觉醒技能。', [knowledge('命器核心技能')]],
  ['near-death', '死亡擦肩', '生死危机提升了你的灵力上限。', [power(-10), { type: 'max-soul-power', amount: 10 }, title('重生意志')]],
  ['underground-arena', '秘密地下竞技场', '地下擂台为你带来秘宝。', [item('地下竞技场秘宝'), power(5)]],
  ['letter-returns', '神秘来信再至', '中级阶段的密信迎来后续。', [flag('mysterious-letter-resolved')]],
  ['sublimation-ritual', '命器升华仪式', '学院仪式提升了命器境界。', [power(12), flag('spirit-sublimation')]],
  ['divine-beast-resonance', '与神兽共鸣', '上古神兽赐予祝福。', [flag('red-ring-chance-plus-5')]],
  ['amnesia', '失忆与觉醒', '失忆后的重新觉醒带来顿悟。', [power(15), flag('lose-one-history')]],
  ['noble-title', '帝国赐封', '帝国因功授予你贵族头衔。', [title('贵族'), relationship('empire', 15)]],
  ['titled-duel', '封号灵尊战', '你被迫与封号灵尊交手。', [power(-15), title('挑战封号灵尊')]],
  ['xiao-wu-sacrifice', '舞灵牺牲之际', '全陆因舞灵牺牲而震动。', [flag('xiao-wu-sacrifice-witness')]],
  ['legendary-ascension-road', '时代至尊之路', '时代至尊觉醒，主角互动解锁。', [{ type: 'hero-unlock' }]],
  ['device-conference', '灵导师会议', '你获得大陆科技情报。', [knowledge('魂导科技前沿')]],

  ['divine-weapon', '神兵利器出世', '你参与神兵争夺。', [item('神兵线索'), flag('divine-weapon-contest')]],
  ['spirit-evolution', '命器进化', '命器自发迈向下一形态。', [flag('spirit-evolution-check')]],
  ['destiny-call', '命运的召唤', '神秘力量召唤你走向毕业后的世界。', [flag('adult-destiny-call')]],
]

const choiceEvents: GameEvent[] = [
  {
    ...event('high', 'spirit-hall-contact', '圣殿正面接触', '圣殿代表正式招募你。'),
    choices: [
      {
        id: 'join',
        label: '加入圣殿',
        effects: [flag('joined-spirit-hall'), relationship('sanctuary', 25), title('圣殿弟子')],
      },
      {
        id: 'refuse',
        label: '婉言拒绝',
        effects: [flag('spirit-hall-hatred'), relationship('sanctuary', -15)],
      },
    ],
  },
  {
    ...event('high', 'royal-marriage', '皇室联姻', '皇室向你提出联姻。'),
    choices: [
      {
        id: 'accept',
        label: '接受联姻',
        effects: [relationship('empire', 20), flag('royal-marriage-accepted'), relationship('reputation', -3)],
      },
      {
        id: 'decline',
        label: '谢绝联姻',
        effects: [relationship('empire', -5), relationship('reputation', 5)],
      },
    ],
  },
]

export const highEvents: GameEvent[] = [
  ...seeds.map(([id, name, description, effects]) =>
    event('high', id, name, description, effects),
  ),
  ...choiceEvents,
]
