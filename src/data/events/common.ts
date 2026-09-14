import type { ContentGameEvent as GameEvent } from '../../rewrite/content/types'
import { event, flag, item, knowledge, power, relationship } from './helpers'

export const commonEvents: GameEvent[] = [
  event('common', 'mysterious-dream', '神秘梦境', '命器意识在梦中苏醒。', [knowledge('潜在命器技能')]),
  event('common', 'ancient-tomb', '古墓现世', '古墓中可能藏有精良灵骨。', [flag('roll-refined-bone-50')]),
  event('common', 'meteor', '陨石降落', '天外陨石带来奇异能量。', [power(12), item('天外陨石碎片')]),
  event('common', 'delicacy', '绝世美食', '一顿美食让你心境极佳。', [power(3)]),
  event('common', 'spirit-hall-hunt', '被圣殿追杀', '圣殿的追兵紧随而至。', [power(-5), relationship('sanctuary', -5)]),
  event('common', 'hero-clash', '与宿敌正面交锋', '命运推动你与宿敌正面对峙。', [{ type: 'hero-unlock' }]),
]
