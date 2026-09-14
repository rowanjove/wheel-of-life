import type { EndingId } from '../../rewrite/content/types'

export type EndingDefinition = {
  id: EndingId
  name: string
  title: string
  comment: string
}

export const endingDefinitions: EndingDefinition[] = [
  { id: 'divine-companion', name: '天境同行', title: '灵元之神', comment: '你越过人间极限，与群星并肩。' },
  { id: 'human-god', name: '人间封神', title: '守护灵元', comment: '你拥有至尊之力，却选择守望人间。' },
  { id: 'legend-finale', name: '传奇落幕', title: '封号灵尊', comment: '你的名号被大陆铭记，岁月不能磨灭。' },
  { id: 'hero-rest', name: '英雄长眠', title: '时代英雄', comment: '你曾为时代挺身而出，后来者仍传颂你的故事。' },
  { id: 'ordinary-life', name: '平凡一生', title: '时代过客', comment: '你没有站在顶峰，却认真走完了自己的道路。' },
  { id: 'passing-traveler', name: '随风而逝', title: '短暂旅人', comment: '旅途短暂，但每一次选择都属于你。' },
  { id: 'gracious-retirement', name: '甘拜下风', title: '知进退者', comment: '承认差距并非怯懦，你在山林中找到新的天地。' },
  { id: 'rival-legend', name: '宿敌传说', title: '命运宿敌', comment: '你与传奇多次平分秋色，成为彼此时代的注脚。' },
  { id: 'spirit-hall-child', name: '圣殿之子', title: '殿中有我', comment: '无论旧殿兴亡，你都把自己的名字留在其中。' },
  { id: 'spirit-hall-remnant', name: '殿中余烬', title: '覆灭幸存者', comment: '圣殿倾覆后，你带着旧日誓言走入新纪元。' },
  { id: 'reckoning-day', name: '清算之日', title: '旧恨得偿', comment: '殿宇崩塌之时，你终于看见宿怨落地。' },
  { id: 'island-hermit', name: '孤岛隐士', title: '世外仙人', comment: '你远离主角与纷争，在孤岛上自成天地。' },
]

export const endingsById = Object.fromEntries(
  endingDefinitions.map((ending) => [ending.id, ending]),
) as Record<EndingId, EndingDefinition>
