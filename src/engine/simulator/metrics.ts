import { modernWorldPack } from '../../worlds/modern'
import { wuxiaWorldPack } from '../../worlds/wuxia'
import { xianxiaWorldPack } from '../../worlds/xianxia'
import { initWorldLife, stepGenericLife } from '../core/genericLifeSim'
import type { PlayerPolicy } from './autoPlayer'

export interface SimulationMetrics {
  world: string
  totalRuns: number
  policy: PlayerPolicy
  durationMs: number
  lifespans: {
    average: number
    median: number
    min: number
    max: number
  }
  averageDecisions: number
  averageWheels: number
  endingDistribution: Record<string, { count: number; percentage: number }>
  originDistribution: Record<string, { count: number; percentage: number }>
  eventTriggerCounts: Record<string, number>
}

export function runSimulationSuite(
  runs = 1000,
  policy: PlayerPolicy = 'balanced',
  world = 'modern',
): SimulationMetrics {
  const startTime = Date.now()
  const ages: number[] = []
  let totalDecisions = 0
  let totalWheels = 0
  const endingCounts: Record<string, number> = {}
  const originCounts: Record<string, number> = {}
  const eventCounts: Record<string, number> = {}

  const pack =
    world === 'xianxia'
      ? xianxiaWorldPack
      : world === 'wuxia'
      ? wuxiaWorldPack
      : modernWorldPack

  for (let i = 0; i < runs; i++) {
    const seed = 10000 + i * 37
    let session = initWorldLife(pack, seed)

    let steps = 0
    while (!session.isFinished && steps < 100) {
      if (session.pendingEvent && session.pendingEvent.options && session.pendingEvent.options.length > 0) {
        totalDecisions++
        // 简单策略挑选选项
        const opts = session.pendingEvent.options
        const pickIdx = i % opts.length
        const chosen = opts[pickIdx] ?? opts[0]
        const res = stepGenericLife(session, chosen.id)
        session = res.session
      } else {
        totalWheels++
        const res = stepGenericLife(session)
        session = res.session
      }
      steps++
    }

    ages.push(session.character.age)

    const endingId = session.ending?.endingId ?? 'natural-end'
    endingCounts[endingId] = (endingCounts[endingId] || 0) + 1

    const originId = session.character.originId ?? 'unknown'
    originCounts[originId] = (originCounts[originId] || 0) + 1

    for (const h of session.character.history) {
      if (h.type === 'event' || h.type === 'choice') {
        eventCounts[h.title] = (eventCounts[h.title] || 0) + 1
      }
    }
  }

  ages.sort((a, b) => a - b)
  const medianAge = ages[Math.floor(ages.length / 2)] ?? 0
  const avgAge = Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10

  const endingDistribution: Record<string, { count: number; percentage: number }> = {}
  for (const [id, count] of Object.entries(endingCounts)) {
    endingDistribution[id] = {
      count,
      percentage: Math.round((count / runs) * 1000) / 10,
    }
  }

  const originDistribution: Record<string, { count: number; percentage: number }> = {}
  for (const [id, count] of Object.entries(originCounts)) {
    originDistribution[id] = {
      count,
      percentage: Math.round((count / runs) * 1000) / 10,
    }
  }

  return {
    world,
    totalRuns: runs,
    policy,
    durationMs: Date.now() - startTime,
    lifespans: {
      average: avgAge,
      median: medianAge,
      min: ages[0] ?? 0,
      max: ages[ages.length - 1] ?? 0,
    },
    averageDecisions: Math.round((totalDecisions / runs) * 10) / 10,
    averageWheels: Math.round((totalWheels / runs) * 10) / 10,
    endingDistribution,
    originDistribution,
    eventTriggerCounts: eventCounts,
  }
}
