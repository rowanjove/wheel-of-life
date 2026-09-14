export type HeroTimelineEntry = {
  year: number
  age: number
  event: string
}

/** 世界编年史重大历史节点 — 彻底摆脱特定作品英雄个人成长轨迹 */
export const heroTimeline: HeroTimelineEntry[] = [
  { year: 1, age: 0, event: '新纪元启幕，古老秩序迎来最初的动荡。' },
  { year: 6, age: 6, event: '各地异象频生，世间涌现出众多天赋异禀的新生代。' },
  { year: 12, age: 12, event: '列国学府广开门庭，各路年轻才俊汇聚一堂。' },
  { year: 18, age: 18, event: '四方大陆争端升级，各大阵营开始全面整军备战。' },
  { year: 24, age: 24, event: '席卷全境的动荡爆发，旧日诸强格局剧变。' },
  { year: 32, age: 32, event: '古老秘境重现人间，传说中的力量觉醒。' },
  { year: 45, age: 45, event: '大陆迈入全新繁荣与秩序阶段，群雄并起。' },
]

export function heroEventAt(year: number): string {
  let current = '大陆维持着初立时期的旧日秩序。'
  for (const entry of heroTimeline) {
    if (year < entry.year) break
    current = entry.event
  }
  return current
}
