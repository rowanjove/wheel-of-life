import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { RewriteCommand, RewriteRun } from '../../engine/model'
import { wheelOptionsForRun } from '../../engine/reducer'
import { getLexicon } from '../../../content/lexicon'
import { CenteredResultDialog } from '../dialogs/CenteredResultDialog'
import { DestinyWheel } from '../wheel/DestinyWheel'

const FULL_DURATION_MS = 3600
const REDUCED_DURATION_MS = 350

function screenTitle(run: RewriteRun): string {
  const { phase, step } = run.flow
  const lex = getLexicon()
  const titles: Record<string, string> = {
    looks: '容貌',
    timeline: '出生时代',
    'birth-place': '出生地',
    race: '种族',
    'spirit-count': `${lex.spiritLabel}数量`,
    'innate-power': '先天灵力',
    talent: '特殊天赋',
    'school-selection': '选择学院',
    'special-event': '命运际遇',
    qualifier: '大赛资格赛',
    'group-1': '大赛小组赛·第一场',
    'group-2': '大赛小组赛·第二场',
    'group-3': '大赛小组赛·第三场',
    quarterfinal: '大赛淘汰赛',
    semifinal: '大赛半决赛',
    final: '大赛决赛',
    'hero-interaction': `${lex.heroName}互动`,
    'hero-opportunity': '白金机缘',
    'tang-san': `再会${lex.heroName}`,
    'tang-san-conflict': `${lex.heroName}冲突`,
    'cultivation-year-1': '灵兽修炼',
    'bone-choice': `${lex.boneLabel}抉择`,
    'soul-bone-choice': `${lex.boneLabel}抉择`,
    'early-contest-offer': '提前参赛',
    'ascension-offer': '飞升抉择',
  }
  if (step === 'event-count') {
    if (phase === 'adult') return '未来五年际遇'
    if (phase === 'high-school') return '五年际遇'
    return '六年际遇'
  }
  if (titles[step]) return titles[step]
  const spirit = step.match(/^spirit-(\d+)(-category)?$/)
  if (spirit) {
    return spirit[2]
      ? `第 ${spirit[1]} ${lex.spiritLabel}类别`
      : `第 ${spirit[1]} ${lex.spiritLabel}`
  }
  const ring = step.match(/^(?:soul-)?ring-(\d+)$/)
  if (ring) return `第 ${ring[1]} ${lex.ringLabel}`
  const year = step.match(/^year-(\d+)$/)
  if (year) return `第 ${year[1]} 年`
  return '命运转盘'
}

function safeWheelOptions(run: RewriteRun) {
  try {
    return wheelOptionsForRun(run)
  } catch {
    return []
  }
}

type WheelScreenProps = {
  run: RewriteRun
  dispatch(command: RewriteCommand): void
}

export function WheelScreen({ run, dispatch }: WheelScreenProps) {
  const options = useMemo(() => safeWheelOptions(run), [run])
  const completedRef = useRef(false)
  const duration = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? REDUCED_DURATION_MS
    : FULL_DURATION_MS
  const targetOptionId = run.pending?.kind === 'wheel' ? run.pending.optionId : null

  useEffect(() => {
    completedRef.current = false
  }, [run.pending?.id])

  const finishAnimation = useCallback(() => {
    if (run.flow.status !== 'animating' || completedRef.current) return
    completedRef.current = true
    dispatch({ type: 'ANIMATION_FINISHED' })
  }, [dispatch, run.flow.status])

  useEffect(() => {
    if (run.flow.status !== 'animating') return undefined
    const timeout = globalThis.setTimeout(finishAnimation, duration + 400)
    return () => globalThis.clearTimeout(timeout)
  }, [duration, finishAnimation, run.flow.status])

  if (options.length === 0) {
    return (
      <main>
        <p>命运转盘</p>
        <h1>{screenTitle(run)}</h1>
        <p>当前阶段无法继续转盘，请尝试刷新进度或开始新人生。</p>
        <button type="button" onClick={() => globalThis.location.reload()}>
          刷新页面
        </button>
      </main>
    )
  }

  return (
    <main className="wheel-screen">
      <p className="wheel-screen__eyebrow">命运转盘</p>
      <h1 className="wheel-screen__title">{screenTitle(run)}</h1>
      <p className="wheel-screen__hint">点击中心按钮旋转；需要看详情时再展开下方选项列表。</p>
      <DestinyWheel
        options={options}
        status={run.flow.status}
        onSpin={() => dispatch({ type: 'START_WHEEL' })}
        targetOptionId={targetOptionId}
        rotationDurationMs={duration}
        onRotationEnd={finishAnimation}
      />
      {run.flow.status === 'result-pending' && run.pending?.kind === 'wheel' ? (
        <CenteredResultDialog
          result={run.pending}
          onConfirm={() => dispatch({ type: 'CONFIRM_RESULT' })}
        />
      ) : null}
    </main>
  )
}
