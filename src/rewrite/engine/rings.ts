import type { WheelOption } from './creation'
import type {
  Flow,
  RingQuality,
  RewriteRun,
  RingState,
} from './model'
import type { ReplayableRng } from './rng'
import { talentRingModifiers } from './talents'

type NormalRingQuality = Exclude<RingQuality, 'divine'>

export type RingModifiers = {
  qualityMultipliers?: Partial<Record<NormalRingQuality, number>>
}

export type RingBin = {
  id: string
  ringIndex: number
  quality: NormalRingQuality
  min: number
  max: number
  weight: number
}

export const BASE_RING_WEIGHTS: Record<
  number,
  Record<NormalRingQuality, number>
> = {
  1: { white: 55, yellow: 40, purple: 5, black: 0, red: 0, 'gold-white': 0 },
  2: { white: 20, yellow: 60, purple: 18, black: 2, red: 0, 'gold-white': 0 },
  3: { white: 5, yellow: 45, purple: 42, black: 8, red: 0, 'gold-white': 0 },
  4: { white: 1, yellow: 20, purple: 54, black: 25, red: 0, 'gold-white': 0 },
  5: { white: 0, yellow: 7, purple: 38, black: 54, red: 1, 'gold-white': 0 },
  6: { white: 0, yellow: 2, purple: 30, black: 65, red: 3, 'gold-white': 0 },
  7: { white: 0, yellow: 0, purple: 15, black: 72, red: 12.8, 'gold-white': 0.2 },
  8: { white: 0, yellow: 0, purple: 5, black: 68, red: 26, 'gold-white': 1 },
  9: { white: 0, yellow: 0, purple: 1, black: 54, red: 42, 'gold-white': 3 },
}

const qualityMeta: Record<
  Exclude<NormalRingQuality, 'gold-white'>,
  { min: number; max: number; step: number }
> = {
  white: { min: 10, max: 99, step: 10 },
  yellow: { min: 100, max: 999, step: 100 },
  purple: { min: 1_000, max: 9_999, step: 1_000 },
  black: { min: 10_000, max: 99_999, step: 10_000 },
  red: { min: 100_000, max: 999_999, step: 100_000 },
}

const colors: Record<NormalRingQuality, string> = {
  white: '#f7fbff',
  yellow: '#f3d66d',
  purple: '#a98bd9',
  black: '#273044',
  red: '#d85d6f',
  'gold-white': '#fff8d9',
}

const labels: Record<NormalRingQuality, string> = {
  white: '白色',
  yellow: '黄色',
  purple: '紫色',
  black: '黑色',
  red: '红色',
  'gold-white': '金白色',
}

export function ringQualityLabel(quality: RingQuality): string {
  if (quality === 'divine') return '神赐'
  return labels[quality]
}

export function classifyRingYears(years: number): NormalRingQuality {
  if (!Number.isInteger(years) || years < 10) throw new Error('灵环年份无效')
  if (years < 100) return 'white'
  if (years < 1_000) return 'yellow'
  if (years < 10_000) return 'purple'
  if (years < 100_000) return 'black'
  if (years < 1_000_000) return 'red'
  return 'gold-white'
}

function baseBins(
  ringIndex: number,
  quality: NormalRingQuality,
  previousYears: number,
): Array<Omit<RingBin, 'weight'>> {
  if (quality === 'gold-white') {
    const alignedStart = previousYears < 1_000_000
      ? 1_000_000
      : Math.floor(previousYears / 1_000_000) * 1_000_000
    return Array.from({ length: 9 }, (_, index) => {
      const lower = alignedStart + index * 1_000_000
      return {
        id: `ring-${ringIndex}-${quality}-${lower}-${lower + 999_999}`,
        ringIndex,
        quality,
        min: lower,
        max: lower + 999_999,
      }
    })
  }

  const meta = qualityMeta[quality]
  const count = Math.ceil((meta.max - meta.min + 1) / meta.step)
  return Array.from({ length: count }, (_, index) => {
    const min = meta.min + index * meta.step
    const max = Math.min(meta.max, min + meta.step - 1)
    return {
      id: `ring-${ringIndex}-${quality}-${min}-${max}`,
      ringIndex,
      quality,
      min,
      max,
    }
  })
}

export function buildLegalRingBins(
  ringIndex: number,
  previousYears: number,
  modifiers: RingModifiers,
): RingBin[] {
  const baseWeights = BASE_RING_WEIGHTS[ringIndex]
  if (!baseWeights) throw new Error('灵环序号必须在 1 到 9 之间')

  const bins: RingBin[] = []
  for (const quality of Object.keys(baseWeights) as NormalRingQuality[]) {
    const qualityWeight =
      baseWeights[quality] * (modifiers.qualityMultipliers?.[quality] ?? 1)
    if (qualityWeight <= 0) continue
    const qualityBins = baseBins(ringIndex, quality, previousYears)
    const binWeight = qualityWeight / qualityBins.length
    for (const bin of qualityBins) {
      if (bin.max <= previousYears) continue
      bins.push({
        ...bin,
        min: Math.max(bin.min, previousYears + 1),
        weight: binWeight,
      })
    }
  }

  const total = bins.reduce((sum, bin) => sum + bin.weight, 0)
  if (total <= 0) throw new Error('没有满足递增约束的灵环年份格')
  return bins.map((bin) => ({ ...bin, weight: bin.weight / total * 100 }))
}

function applyFlagRingAdjustments(
  bins: RingBin[],
  flags: readonly string[],
): RingBin[] {
  if (!flags.includes('red-ring-chance-plus-5')) return bins
  const adjusted = bins.map((bin) =>
    bin.quality === 'red'
      ? { ...bin, weight: bin.weight + 5 }
      : bin,
  )
  const total = adjusted.reduce((sum, bin) => sum + bin.weight, 0)
  return adjusted.map((bin) => ({ ...bin, weight: bin.weight / total * 100 }))
}

export function totalWeightByQuality(
  bins: readonly RingBin[],
): Record<NormalRingQuality, number> {
  const totals: Record<NormalRingQuality, number> = {
    white: 0,
    yellow: 0,
    purple: 0,
    black: 0,
    red: 0,
    'gold-white': 0,
  }
  for (const bin of bins) totals[bin.quality] += bin.weight
  return totals
}

export function rollYearsWithinBin(
  bin: RingBin,
  rng: ReplayableRng,
): number {
  return rng.integer(bin.min, bin.max)
}

export function missingRingIndexes(
  level: number,
  rings: readonly RingState[],
): number[] {
  const owned = new Set(rings.map((ring) => ring.index))
  const unlocked = Math.min(9, Math.floor(level / 10))
  const missing: number[] = []
  for (let index = 1; index <= unlocked; index += 1) {
    if (!owned.has(index)) missing.push(index)
  }
  return missing
}

export function ringWheelOptions(run: RewriteRun): WheelOption<RingBin>[] {
  const ringIndex = Number(run.flow.step.replace(/^(?:soul-)?ring-/, ''))
  const previousYears = run.character.rings.at(-1)?.years ?? 0
  const bins = applyFlagRingAdjustments(
    buildLegalRingBins(
      ringIndex,
      previousYears,
      talentRingModifiers(run.character.talentId),
    ),
    run.character.flags,
  )
  return bins.map((bin) => ({
    id: bin.id,
    name: `${labels[bin.quality]} ${bin.min.toLocaleString()}–${bin.max.toLocaleString()}年`,
    description: `选中后将在 ${bin.min.toLocaleString()} 至 ${bin.max.toLocaleString()} 年之间生成具体整数年份。`,
    weight: bin.weight,
    color: colors[bin.quality],
    value: bin,
  }))
}

export function queueMissingRingActivities(
  run: RewriteRun,
  returnTo: Flow,
): RewriteRun {
  const missing = missingRingIndexes(run.character.level, run.character.rings)
  if (missing.length === 0) {
    return { ...run, flow: returnTo, pending: null }
  }
  const [first, ...rest] = missing
  return {
    ...run,
    flow: { phase: returnTo.phase, step: `soul-ring-${first}`, status: 'ready' },
    stack: [
      ...run.stack,
      {
        returnTo,
        queue: rest.map((index) => ({
          phase: returnTo.phase,
          step: `soul-ring-${index}`,
          status: 'ready',
        })),
        context: {},
      },
    ],
    pending: null,
  }
}
