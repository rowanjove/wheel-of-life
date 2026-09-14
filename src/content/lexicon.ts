/** Player-facing terminology. Overridable by content packs. */

export type Lexicon = {
  gameTitle: string
  calendarName: string
  worldName: string
  spiritLabel: string
  ringLabel: string
  boneLabel: string
  heroName: string
  heroFaction: string
  enterWorldCta: string
  /** Level-band titles: [apprentice, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100+] */
  rankTitles: readonly string[]
}

export const BASE_LEXICON: Lexicon = {
  gameTitle: '轮盘人生',
  calendarName: '灵元历',
  worldName: '灵元大陆',
  spiritLabel: '命器',
  ringLabel: '灵环',
  boneLabel: '灵骨',
  heroName: '时代传奇',
  heroFaction: '圣殿',
  enterWorldCta: '踏入灵元大陆',
  rankTitles: [
    '灵修学徒',
    '灵修',
    '大灵修',
    '灵尊',
    '灵宗',
    '灵王',
    '灵皇',
    '灵圣',
    '灵帝',
    '封号灵尊',
    '至尊灵尊',
  ],
}

let activeLexicon: Lexicon = { ...BASE_LEXICON }

export function getLexicon(): Lexicon {
  return activeLexicon
}

export function setLexicon(partial: Partial<Lexicon> | undefined): void {
  activeLexicon = { ...BASE_LEXICON, ...partial }
}

export function resetLexicon(): void {
  activeLexicon = { ...BASE_LEXICON }
}

export function rankTitleForLevel(level: number, lexicon: Lexicon = activeLexicon): string {
  const t = lexicon.rankTitles
  if (level >= 100) return t[10]
  if (level >= 90) return t[9]
  if (level >= 80) return t[8]
  if (level >= 70) return t[7]
  if (level >= 60) return t[6]
  if (level >= 50) return t[5]
  if (level >= 40) return t[4]
  if (level >= 30) return t[3]
  if (level >= 20) return t[2]
  if (level >= 10) return t[1]
  return t[0]
}
