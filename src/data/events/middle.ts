import type { ContentGameEvent as GameEvent } from '../../rewrite/content/types'
import { event, flag, item, knowledge, power, relationship, title } from './helpers'

const seeds: Array<[string, string, string, ReturnType<typeof power>[] | any[]]> = [
  ['shrek-seven', '七星战队传说', '七怪的传说开始流传。', [flag('heard-shrek-seven')]],
  ['contest-selection', '大赛选拔', '学校开始组队备战精英联赛。', [flag('school-team'), relationship('reputation', 5)]],
  ['thousand-ring', '千年灵环', '你击杀千年灵兽，积累猎魂经验。', [flag('current-ring-double-chance')]],
  ['spirit-hall-saint', '圣殿圣女', '圣殿重要人物造访本地。', [relationship('sanctuary', 5)]],
  ['life-duel', '同门生死战', '理念冲突演化为一场决斗。', [power(4), flag('won-school-duel')]],
  ['continent-trip', '大陆之旅', '跨大陆游学拓展了你的视野。', [flag('map-unlocked'), knowledge('大陆地理')]],
  ['spirit-herb', '精魂草药', '稀有草药令功力大进。', [power(10)]],
  ['ancient-relic', '古灵修遗物', '古战场遗物中残留灵骨气息。', [flag('roll-refined-bone-30')]],
  ['friendship-match', '联校友谊赛', '比赛为你带来新的人脉。', [relationship('reputation', 5), flag('partner-candidate')]],
  ['hidden-weapon', '暗器工坊', '唐门弟子传授暗器知识。', [knowledge('唐门暗器'), flag('extra-event')]],
  ['beast-rampage', '灵兽暴走', '全校合力抵御暴走灵兽。', [power(8), relationship('beasts', -3)]],
  ['old-master', '神秘老人传艺', '白发老人传你一门绝技。', [knowledge('神秘绝技')]],
  ['spirit-variation', '命器变异', '命器朝更高层次异变。', [flag('spirit-evolution-check')]],
  ['assassination', '暗杀事件', '仇家派人暗中行刺。', [power(-8), title('劫后余生')]],
  ['meet-xiao-wu', '偶遇舞灵', '你在旅途中偶遇舞灵。', [{ type: 'hero-unlock' }]],
  ['army-training', '军中历练', '前线半年磨炼了你的战意。', [power(6), title('战场淬炼')]],
  ['soul-device-accident', '灵导器意外', '你从爆炸中救出师生。', [power(-2), relationship('reputation', 10), title('英雄')]],
  ['love-begins', '爱情开始', '你邂逅了愿意同行的人。', [{ type: 'partner', name: '命定伴侣' }]],
  ['frozen-night', '冰封之夜', '封印结界赋予你冰系抗性。', [flag('ice-resistance')]],
  ['forbidden-library', '图书馆禁区', '禁区中藏着大陆机密。', [knowledge('大陆机密')]],
  ['ancient-battlefield', '古战场遗迹', '战场遗址有罕见灵骨出世。', [flag('roll-rare-bone-40')]],
  ['ten-thousand-herb', '万年草药', '极品草药带来剧烈蜕变。', [power(15), flag('rest-next-year')]],
  ['spirit-assessment', '命器测评', '帝国评定提高了你的声望。', [relationship('reputation', 8)]],
  ['inheritance-awakening', '命器觉醒传承', '前代持有者残影传下秘技。', [flag('spirit-inheritance'), knowledge('命器隐藏技能')]],
  ['contest-spectator', '联赛观战', '观战使你掌握联赛情报。', [knowledge('联赛情报')]],
  ['family-change', '家族变故', '家人遭遇变故，你必须作出取舍。', [flag('family-crisis')]],
  ['beast-contract', '灵兽契约', '你与智慧灵兽签订协议。', [title('灵兽友人'), relationship('beasts', 15)]],
  ['device-prototype', '超级灵导器实验品', '高风险试验最终成功。', [power(10), item('灵导器实验品')]],
  ['secret-letter', '神秘密信', '来源不明的密信开启事件链。', [flag('mysterious-letter')]],
  ['fateful-meeting', '命运的相遇', '你在人潮中与传奇正面相遇。', [{ type: 'hero-unlock' }]],
]

export const middleEvents: GameEvent[] = seeds.map(([id, name, description, effects]) =>
  event('middle', id, name, description, effects),
)
