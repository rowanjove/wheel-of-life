import type { ContentGameEvent as GameEvent } from '../../rewrite/content/types'
import { event, flag, item, knowledge, power, relationship, title } from './helpers'

export const primaryEvents: GameEvent[] = [
  event('primary', 'unexpected-master', '意外的先生', '一位路过的强者偶然传授你一招。', [power(3), knowledge('技能关键词：点拨')]),
  event('primary', 'beast-cub', '灵兽幼崽', '你救下一只误入校园的灵兽幼崽。', [title('动物亲和'), relationship('beasts', 8), flag('ring-affinity-small')]),
  {
    ...event('primary', 'classmate-secret', '同学的秘密', '你发现同学暗中与圣殿接触。'),
    choices: [
      { id: 'report', label: '告发', effects: [flag('reported-spirit-hall-contact'), relationship('sanctuary', -5), relationship('reputation', 3)] },
      { id: 'silence', label: '沉默', effects: [flag('kept-classmate-secret'), relationship('sanctuary', 3)] },
    ],
  },
  event('primary', 'old-book', '老旧典籍', '你在图书室发现训练秘笈。', [{ type: 'growth-multiplier', amount: 0.1 }, knowledge('老旧训练秘笈')]),
  {
    ...event('primary', 'herb-accident', '草药意外', '采药时误入灵兽领地。'),
    choices: [
      { id: 'escape', label: '逃跑', effects: [flag('escaped-beast-territory')] },
      { id: 'fight', label: '战斗', effects: [power(2), relationship('beasts', -2)] },
    ],
  },
  event('primary', 'school-arena', '校园擂台赛', '你参加校内擂台并有所顿悟。', [power(5), relationship('reputation', 4)]),
  event('primary', 'wandering-master', '流浪武灵修', '落魄灵修与你夜谈大陆秘闻。', [knowledge('大陆传说')]),
  event('primary', 'injury', '意外受伤', '修炼偏差使你元气受损。', [power(-3), title('坚韧')]),
  event('primary', 'shrek-student', '偶遇七星学生', '外出时遇见七星同龄学员。', [flag('met-shrek-student')]),
  event('primary', 'young-hero', '偶遇宿敌（幼年）', '街头一面令命运产生涟漪。', [{ type: 'hero-unlock' }]),
  event('primary', 'abandoned-grave', '荒废武灵修之墓', '古墓中似乎藏着灵骨。', [flag('roll-common-soul-bone-30')]),
  event('primary', 'master-exam', '灵修考核大会', '你提前参加大区考核并通过。', [power(5), relationship('reputation', 3)]),
  event('primary', 'mysterious-rune', '神秘符文', '遗迹符文使命器产生共鸣。', [flag('innate-skill-unlocked')]),
  event('primary', 'ravine', '跌入山涧', '绝境下发现一处修炼宝地。', [power(5), { type: 'growth-multiplier', amount: 0.05 }]),
  {
    ...event('primary', 'spirit-hall-recruit', '圣殿征募', '圣殿暗探向你递来橄榄枝。'),
    choices: [
      { id: 'join', label: '加入', effects: [flag('joined-spirit-hall'), relationship('sanctuary', 20)] },
      { id: 'refuse', label: '拒绝', effects: [flag('spirit-hall-hatred'), relationship('sanctuary', -10)] },
    ],
  },
  event('primary', 'classmate-gift', '同学的礼物', '好友在毕业前赠你灵导器。', [item('初级灵导器')]),
  event('primary', 'teacher-favor', '先生的偏爱', '先生给予你三年额外指导。', [power(3), flag('teacher-training-3-years')]),
  event('primary', 'epidemic', '流行病', '你照顾病患，赢得众人敬重。', [title('慈悲'), relationship('reputation', 6)]),
  {
    ...event('primary', 'black-market-ring', '黑市灵环', '来路不明的商人兜售廉价灵环。'),
    choices: [
      { id: 'buy', label: '购买', effects: [item('可疑灵环契约'), flag('black-market-ring')] },
      { id: 'refuse', label: '拒绝', effects: [flag('refused-black-market-ring')] },
    ],
  },
  event('primary', 'beast-attack', '灵兽袭击', '师生被灵兽群围困，你奋力突围。', [power(5), title('校园守卫者')]),
  event('primary', 'ancient-spirit-book', '古代命器书籍', '旧书摊上的古籍扩展了你的见闻。', [knowledge('冷门命器知识')]),
  event('primary', 'meditation', '冥想开悟', '深夜顿悟使灵力猛增。', [power(8)]),
  event('primary', 'hunter-friends', '结交灵兽猎人', '你随猎魂队完成一次出征。', [title('猎魂经验'), flag('next-ring-year-bonus')]),
  event('primary', 'spirit-mutation', '命器觉醒异变', '命器出现微小而未知的变化。', [flag('spirit-hidden-trait')]),
  event('primary', 'school-legend', '成为传说', '你以天才之名从学校毕业。', [title('小天才'), relationship('reputation', 10)]),
]
