import type { ContentGameEvent as GameEvent } from '../../rewrite/content/types'
import { event, flag, item, knowledge, power, relationship, title } from './helpers'

const explicit: Array<[string, string, string, any[]]> = [
  ['titled-road', '封号之路', '你有感于天地，踏上封号之路。', [power(20), title('封号之路')]],
  ['divine-contact', '天境接触', '你第一次感应到天境波动。', [flag('divine-contact')]],
  ['hero-godhood', '时代巨擘崛起', '顶尖强者的崛起重塑了大陆格局。', [flag('hero-godhood')]],
  ['spirit-hall-fall', '圣殿覆灭', '圣殿覆灭，旧关系迎来清算。', [flag('spirit-hall-fallen')]],
  ['ascension-chance', '天境飞升机缘', '天境召唤降临，百级者可以飞升。', [flag('ascension-choice')]],
  ['old-age', '老死之准备', '你感到寿元将尽，开始安排遗产。', [flag('lifespan-ending')]],
]

const supplements: Array<[string, string, string, any[]]> = [
  ['secluded-cultivation', '闭关十载', '漫长闭关令灵力更加凝练。', [power(12)]],
  ['sect-founder', '开宗立派', '你创建自己的灵修宗门。', [title('一宗之主'), relationship('reputation', 15)]],
  ['beast-sanctuary', '灵兽庇护所', '你建立保护灵兽的栖息地。', [relationship('beasts', 20), title('灵兽守护者')]],
  ['imperial-advisor', '帝国顾问', '帝国邀请你参与重大决策。', [relationship('empire', 15), title('帝国顾问')]],
  ['sea-god-island', '海神岛远征', '海上远征拓展了你的见闻。', [power(8), knowledge('海神岛航路')]],
  ['north-pilgrimage', '极北朝圣', '极北寒意磨炼你的意志。', [power(8), flag('ice-resistance')]],
  ['ancient-dragon', '古龙遗迹', '龙脉遗迹中藏着上古传承。', [knowledge('古龙传承'), power(6)]],
  ['soul-device-master', '魂导大师', '多年研究令你成为魂导大师。', [title('魂导大师'), item('宗师灵导器')]],
  ['lost-lover', '故人重逢', '多年失散的故人再次出现。', [{ type: 'partner', name: '重逢故人' }]],
  ['world-war', '大陆战争', '大陆战争迫使你选择阵营。', [relationship('empire', 10), power(5)]],
  ['beast-tide', '万兽潮', '你在兽潮中守护一方百姓。', [title('万兽潮守卫者'), relationship('reputation', 12)]],
  ['heavenly-tribulation', '天劫初临', '高阶灵力引来天地劫数。', [power(-8), { type: 'max-soul-power', amount: 5 }]],
  ['spirit-rebirth', '命器重生', '命器在岁月中完成一次重塑。', [flag('spirit-evolution-check')]],
  ['bone-completion', '灵骨补全', '你得到一条稀有灵骨线索。', [flag('roll-rare-bone-60')]],
  ['ring-refinement', '灵环淬炼', '旧灵环在修炼中得到淬炼。', [flag('ring-refinement')]],
  ['legendary-duel', '传奇决斗', '一位成名强者向你发起挑战。', [power(10), title('传奇决斗者')]],
  ['tang-reunion', '再会传奇', '多年后你再次见到传奇。', [{ type: 'hero-unlock' }]],
  ['divine-messenger', '神使降临', '天境使者传达一项试炼。', [flag('divine-trial')]],
  ['fate-reversal', '命运逆转', '一次失败被意外机缘改写。', [power(8), flag('fate-reversed')]],
  ['ancient-tomb', '上古古墓', '古墓中留下上古至尊时代的线索。', [knowledge('上古古墓'), flag('divine-bone-clue')]],
  ['world-tree', '世界树下', '世界树的气息滋养你的灵魂。', [power(12), { type: 'growth-multiplier', amount: 0.05 }]],
  ['ghost-city', '幽灵古城', '你进入一座只在夜间出现的古城。', [knowledge('幽灵古城'), item('幽魂信物')]],
  ['family-legacy', '家族传承', '你将多年所得留给下一代。', [title('家族先祖'), flag('legacy-prepared')]],
  ['royal-crisis', '皇室危机', '帝国危机需要你的力量。', [relationship('empire', 20), relationship('reputation', 10)]],
  ['sect-war', '宗门大战', '宗门间的旧怨爆发为大战。', [power(7), flag('sect-war-veteran')]],
  ['peace-decade', '太平十年', '长久和平让你专心研究魂技。', [knowledge('自创魂技'), power(5)]],
  ['star-prophecy', '星辰预言', '星象预示你的最终命运。', [flag('ending-prophecy')]],
  ['soul-beast-friend', '灵兽故友', '昔日灵兽故友前来相助。', [relationship('beasts', 10), power(5)]],
  ['last-tournament', '最后的大赛', '你以老将身份参加最后一届赛事。', [relationship('reputation', 10), title('不老斗魂')]],
  ['memory-palace', '记忆宫殿', '你在精神世界重温完整人生。', [knowledge('人生感悟')]],
  ['divine-weapon-awakens', '神兵觉醒', '沉睡神兵认可了你的意志。', [item('觉醒神兵'), power(10)]],
  ['heaven-gate', '天门洞开', '天境之门短暂向人间开启。', [flag('heaven-gate-open')]],
  ['final-enlightenment', '终极顿悟', '暮年顿悟令境界再次提升。', [power(15)]],
  ['retirement', '归隐山林', '你开始考虑远离大陆纷争。', [flag('retirement-choice')]],
]

export const adultEvents: GameEvent[] = [...explicit, ...supplements].map(
  ([id, name, description, effects]) => event('adult', id, name, description, effects),
)
