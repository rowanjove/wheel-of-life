import { describe, expect, it } from 'vitest'
import { getWorldLexicon } from './worldLexicon'

describe('worldLexicon', () => {
  it('returns distinctive lexicons for wuxia, xianxia, and modern', () => {
    const wuxia = getWorldLexicon('wuxia')
    const xianxia = getWorldLexicon('xianxia')
    const modern = getWorldLexicon('modern')

    // 创角标题差异
    expect(wuxia.creation.title).toContain('投 胎 问 卦')
    expect(xianxia.creation.title).toContain('宿 命 转 生')
    expect(modern.creation.title).toContain('降 生 规 划')

    // 轮盘标题与引言差异
    expect(wuxia.wheel.title).toContain('江湖风云')
    expect(xianxia.wheel.title).toContain('天道因果')
    expect(modern.wheel.title).toContain('人生选择')

    // HUD 术语差异
    expect(wuxia.hud.statsTab).toBe('身手筋骨')
    expect(xianxia.hud.statsTab).toBe('道基灵质')
    expect(modern.hud.statsTab).toBe('个人能力')

    // 终局称号差异
    expect(wuxia.ending.tag).toBe('江 湖 绝 唱')
    expect(xianxia.ending.tag).toBe('仙 途 终 局')
    expect(modern.ending.tag).toBe('人 生 终 篇')
  })

  it('defaults gracefully to wuxia lexicon for unknown world ids', () => {
    const fallback = getWorldLexicon('unknown-realm')
    expect(fallback.creation.title).toContain('投 胎 问 卦')
  })
})
