import { describe, expect, it } from 'vitest'
import { modernWorldPack } from './modern'
import type { WorldPack } from './packTypes'
import { diagnoseWorldPack } from './validator'
import { wuxiaWorldPack } from './wuxia'
import { xianxiaWorldPack } from './xianxia'

describe('Content Reachability & Diagnostics Validator', () => {
  it('confirms Modern, Wuxia, and Xianxia World Packs are 100% healthy with 0 errors', () => {
    const modernReport = diagnoseWorldPack(modernWorldPack)
    expect(modernReport.isHealthy).toBe(true)
    expect(modernReport.errorsCount).toBe(0)

    const wuxiaReport = diagnoseWorldPack(wuxiaWorldPack)
    expect(wuxiaReport.isHealthy).toBe(true)
    expect(wuxiaReport.errorsCount).toBe(0)

    const xianxiaReport = diagnoseWorldPack(xianxiaWorldPack)
    expect(xianxiaReport.isHealthy).toBe(true)
    expect(xianxiaReport.errorsCount).toBe(0)
  })

  it('detects impossible age range constraints (gte > lte)', () => {
    const faultyPack: WorldPack = {
      ...modernWorldPack,
      events: [
        {
          id: 'ev-impossible-age',
          title: '矛盾年龄事件',
          text: '永远不可能触发',
          category: 'daily',
          conditions: { age: { gte: 50, lte: 20 } },
          probability: { mode: 'static_weight', weight: 10 },
        },
      ],
    }

    const report = diagnoseWorldPack(faultyPack)
    expect(report.isHealthy).toBe(false)
    expect(report.errorsCount).toBeGreaterThan(0)
    expect(report.issues.some((i) => i.category === 'impossible_condition')).toBe(true)
    expect(report.issues[0].message).toContain('逻辑矛盾的年龄区间')
  })

  it('detects impossible stat requirements exceeding defined maximums', () => {
    const faultyPack: WorldPack = {
      ...modernWorldPack,
      events: [
        {
          id: 'ev-super-stat',
          title: '超限属性要求',
          text: '属性上限100，这里却要求200',
          category: 'daily',
          conditions: { stat: 'health', op: '>=', value: 200 },
          probability: { mode: 'static_weight', weight: 10 },
        },
      ],
    }

    const report = diagnoseWorldPack(faultyPack)
    expect(report.isHealthy).toBe(false)
    expect(report.issues.some((i) => i.message.includes('超过了上限 100'))).toBe(true)
  })

  it('detects contradictory trait constraints (must have AND must not have trait)', () => {
    const faultyPack: WorldPack = {
      ...modernWorldPack,
      events: [
        {
          id: 'ev-trait-conflict',
          title: '矛盾特质',
          text: '不可能达成的特质要求',
          category: 'daily',
          conditions: {
            all: [
              { trait: 'tr-mod-curious' },
              { not: { trait: 'tr-mod-curious' } },
            ],
          },
          probability: { mode: 'static_weight', weight: 10 },
        },
      ],
    }

    const report = diagnoseWorldPack(faultyPack)
    expect(report.isHealthy).toBe(false)
    expect(report.issues.some((i) => i.message.includes('永远不可达'))).toBe(true)
  })

  it('detects missing event references in queued events', () => {
    const faultyPack: WorldPack = {
      ...modernWorldPack,
      events: [
        {
          id: 'ev-ghost-queue',
          title: '幽灵排队',
          text: '排队一个不存在的事件',
          category: 'daily',
          probability: { mode: 'static_weight', weight: 10 },
          directEffects: [{ type: 'queue_event', eventId: 'ev-non-existent-123' }],
        },
      ],
    }

    const report = diagnoseWorldPack(faultyPack)
    expect(report.isHealthy).toBe(false)
    expect(report.issues.some((i) => i.message.includes('不存在的事件【ev-non-existent-123】'))).toBe(true)
  })
})
