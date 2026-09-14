import { useEffect, useMemo, useRef, useState } from 'react'
import { Wheel } from 'spin-wheel'
import type { WheelOption } from '../../engine/creation'
import type { ActivityStatus } from '../../engine/model'
import { WheelDetailDialog } from './WheelDetailDialog'

/** High-contrast celestial slice palette — 典雅清亮的新国风玄幻色盘 */
const SLICE_COLORS = [
  '#2c547e', // 霁蓝
  '#a43c3c', // 赤霄
  '#2a735b', // 碧峦
  '#9b6c26', // 曜金
  '#684b8a', // 紫虚
  '#1f6376', // 沧溟
  '#a04a29', // 丹阳
  '#3a618a', // 墨青
  '#7e3d5e', // 绛紫
  '#4c7034', // 青玉
  '#8d5c22', // 琥珀
  '#544773', // 幽微
] as const

const DENSE_WHEEL_THRESHOLD = 12

/** Keep quality-coded ring colors recognizable while still giving them enough contrast on canvas. */
const SEMANTIC_COLORS: Record<string, string> = {
  '#f7fbff': '#e9eff5',
  '#f3d66d': '#c69a3c',
  '#a98bd9': '#8f78bd',
  '#273044': '#3a475e',
  '#d85d6f': '#c45c70',
  '#fff8d9': '#dfc477',
}

function DiceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="8" r="1.35" fill="currentColor" />
      <circle cx="16" cy="8" r="1.35" fill="currentColor" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" />
      <circle cx="8" cy="16" r="1.35" fill="currentColor" />
      <circle cx="16" cy="16" r="1.35" fill="currentColor" />
    </svg>
  )
}

/**
 * 智能精炼扇区文字排版：
 * 绝不再暴力清空，确保每个扇区都能呈现清晰易懂的文字标识。
 */
export function formatSliceLabel(name: string, optionCount: number): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  // 针对年份区间做特殊压缩，保持核心年份清晰（例如 "黑色 10000–19999年" -> "1万~2万"）
  const yearMatch = trimmed.match(/(\d+)[–-](\d+)年/)
  if (yearMatch) {
    const startY = Math.round(Number(yearMatch[1]) / 10000)
    const endY = Math.round(Number(yearMatch[2]) / 10000)
    return `${startY}~${endY}万`
  }

  const chars = Array.from(trimmed)
  if (optionCount <= 6) {
    return chars.slice(0, 8).join('')
  }
  if (optionCount <= 10) {
    return chars.length > 5 ? `${chars.slice(0, 4).join('')}…` : trimmed
  }
  if (optionCount <= 16) {
    return chars.length > 4 ? `${chars.slice(0, 3).join('')}…` : trimmed
  }
  // 极密集切片（17+）：提取前两到三字精炼标签，杜绝空白
  return chars.length > 3 ? `${chars.slice(0, 2).join('')}…` : trimmed
}

/**
 * 物理动力学转盘缓动函数：
 * - 起步加速阶段 (0 ~ 0.12)：快速二次蓄力加速，带来强大的启动推力感；
 * - 阻尼衰减阶段 (0.12 ~ 1.0)：平滑四次幂指数阻尼衰减，每一格划过指针清晰可感，终点干脆咬合。
 */
export function destinyWheelEasing(n: number): number {
  const t = Math.max(0, Math.min(1, n))
  if (t < 0.12) {
    const p = t / 0.12
    return 0.06 * (p * p)
  }
  const p = (t - 0.12) / 0.88
  return 0.06 + 0.94 * (1 - Math.pow(1 - p, 3.8))
}

function sliceColor(index: number, fallback: string): string {
  const semantic = SEMANTIC_COLORS[fallback.toLowerCase()]
  if (semantic) return semantic
  const curated = SLICE_COLORS[index % SLICE_COLORS.length]
  if (!fallback || fallback.startsWith('#e') || fallback.startsWith('#f') || fallback.startsWith('#d7') || fallback.startsWith('#cfc')) {
    return curated
  }
  return fallback
}

function labelColorForBg(bg: string): string {
  const hex = bg.replace('#', '')
  if (hex.length !== 6) return '#ffffff'
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#141e2a' : '#ffffff'
}

type DestinyWheelProps = {
  options: readonly WheelOption[]
  status: ActivityStatus
  onSpin(): void
  targetOptionId?: string | null
  rotationDurationMs?: number
  onRotationEnd?(): void
  rotation?: number
}

function optionFingerprint(options: readonly WheelOption[]): string {
  return options.map((o) => `${o.id}:${o.weight}:${o.color}:${o.name}`).join('|')
}

export function DestinyWheel({
  options,
  status,
  onSpin,
  targetOptionId = null,
  rotationDurationMs = 3600,
  onRotationEnd,
}: DestinyWheelProps) {
  const [detail, setDetail] = useState<WheelOption | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<InstanceType<typeof Wheel> | null>(null)
  const onRestRef = useRef(onRotationEnd)
  const statusRef = useRef(status)
  const spunForPending = useRef<string | null>(null)
  const fingerprint = useMemo(() => optionFingerprint(options), [options])
  const interactive = status === 'ready'
  const count = options.length
  const dense = count > DENSE_WHEEL_THRESHOLD

  useEffect(() => {
    onRestRef.current = onRotationEnd
  }, [onRotationEnd])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    wheelRef.current?.remove()
    el.replaceChildren()

    const items = options.map((option, index) => {
      const backgroundColor = sliceColor(index, option.color)
      return {
        label: formatSliceLabel(option.name, count),
        backgroundColor,
        labelColor: labelColorForBg(backgroundColor),
        weight: Math.max(0.001, option.weight),
        value: option.id,
      }
    })

    // 基于 Canvas 基准尺寸 (500px) 设定的合理最大字号，避免高 DPI 或小屏幕下字号缩至 7-9px 模糊黏结
    const baseFontSizeMax = count > 16 ? 22 : count > 10 ? 25 : count > 6 ? 28 : 32

    const wheel = new Wheel(el, {
      items,
      borderWidth: 0,
      borderColor: 'transparent',
      lineWidth: count > 18 ? 0.9 : 1.25,
      lineColor: 'rgba(255,255,255,.55)',
      itemLabelFont: 'bold 15px "Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", sans-serif',
      itemLabelFontSizeMax: baseFontSizeMax,
      itemLabelRadius: count > 10 ? 0.82 : 0.80,
      itemLabelRadiusMax: count > 10 ? 0.26 : 0.22,
      itemLabelAlign: 'right',
      itemLabelRotation: 0,
      itemLabelColors: items.map((item) => item.labelColor),
      radius: 0.96,
      isInteractive: false,
      rotationResistance: -50,
      pointerAngle: 0,
      pixelRatio: Math.min(2.5, globalThis.devicePixelRatio || 1),
    })

    wheel.onRest = () => {
      if (statusRef.current === 'animating') {
        onRestRef.current?.()
      }
    }

    wheelRef.current = wheel
    spunForPending.current = null

    const safeResize = () => {
      if (typeof wheel.resize === 'function') wheel.resize()
    }
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => safeResize())
      : null
    ro?.observe(el)
    const rafId = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame(safeResize)
      : null

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId)
      }
      ro?.disconnect()
      wheel.remove()
      wheelRef.current = null
    }
  }, [fingerprint])

  useEffect(() => {
    const wheel = wheelRef.current
    if (!wheel || options.length === 0) return

    const index = targetOptionId
      ? options.findIndex((option) => option.id === targetOptionId)
      : -1

    if (status === 'ready') {
      spunForPending.current = null
      wheel.rotation = 0
      return
    }

    if (index < 0) return

    if (status === 'animating') {
      const key = targetOptionId ?? ''
      if (spunForPending.current === key) return
      spunForPending.current = key
      if (rotationDurationMs <= 50) {
        wheel.spinToItem(index, 0, true, 0, 1)
        onRestRef.current?.()
        return
      }
      const duration = Math.max(200, rotationDurationMs)
      // 动效调优：旋转 6 圈，带动力学缓动，兼顾高速掠影与平稳阻尼咬合
      const revolutions = duration >= 1800 ? 6 : 1
      wheel.spinToItem(index, duration, true, revolutions, 1, destinyWheelEasing)
      return
    }

    if (status === 'result-pending') {
      if (spunForPending.current !== targetOptionId) {
        spunForPending.current = targetOptionId
        wheel.spinToItem(index, 0, true, 0, 1)
      }
    }
  }, [status, targetOptionId, options, rotationDurationMs])

  return (
    <>
      <div
        className={`destiny-wheel${status === 'animating' ? ' destiny-wheel--animating' : ''}${dense ? ' destiny-wheel--dense' : ''}`}
        data-testid="destiny-wheel"
        aria-busy={status === 'animating'}
      >
        <div className="destiny-wheel__ring" data-testid="wheel-outer-frame" aria-hidden="true" />
        <div className="destiny-wheel__pointer" data-testid="wheel-pointer" aria-hidden="true" />
        <div
          ref={containerRef}
          className="destiny-wheel__canvas-host"
          data-testid="wheel-rotor"
          aria-label="命运转盘"
        />
        <div className="destiny-wheel__hub" data-testid="wheel-gem-center">
          <button
            type="button"
            aria-label={status === 'animating' ? '正在旋转' : '开始旋转'}
            disabled={!interactive}
            onClick={onSpin}
          >
            <DiceIcon />
            <span>{status === 'animating' ? '旋转中' : '旋转'}</span>
          </button>
        </div>
      </div>

      {dense ? (
        <p className="wheel-density-note" data-testid="wheel-density-note">
          分段较密，轮盘保留概率色带；展开下方选项查看完整名称与详情。
        </p>
      ) : null}

      <div className="wheel-option-panel">
        <button
          type="button"
          className="wheel-option-panel__toggle"
          aria-expanded={listOpen}
          onClick={() => setListOpen((value) => !value)}
        >
          {listOpen ? '收起选项' : `查看全部选项（${count}）`}
        </button>
        {listOpen ? (
          <ul className="wheel-option-panel__list">
            {options.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="wheel-option-panel__item"
                  disabled={!interactive}
                  aria-label={`查看 ${option.name} 详情`}
                  onClick={() => setDetail(option)}
                >
                  <span
                    className="wheel-option-panel__swatch"
                    style={{ background: sliceColor(index, option.color) }}
                    aria-hidden="true"
                  />
                  <span className="wheel-option-panel__name">{option.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {detail ? <WheelDetailDialog option={detail} onClose={() => setDetail(null)} /> : null}
    </>
  )
}
