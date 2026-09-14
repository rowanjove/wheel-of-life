import { useState, useMemo } from 'react'
import type { WheelOption } from '../../rewrite/engine/creation'
import { DestinyWheel } from '../../rewrite/ui/wheel/DestinyWheel'
import { useLifeStore } from '../store/lifeStore'
import { CharacterHUD } from './CharacterHUD'
import { CodexScreen } from './CodexScreen'
import { EndingScreen } from './EndingScreen'
import { EventModal } from './EventModal'
import { ProbabilityInspector } from './ProbabilityInspector'
import { StatusHeader2 } from './StatusHeader2'
import { getWorldLexicon } from './worldLexicon'

export function MainGameScreen() {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isCodexOpen, setIsCodexOpen] = useState(false)
  const {
    session,
    phase,
    isSpinning,
    targetSectorId,
    playMode,
    soundMuted,
    togglePlayMode,
    toggleSound,
    spinFateWheel,
    onSpinAnimationComplete,
  } = useLifeStore()

  // 映射轮盘扇区：优先展示最近冻结的快照；若无快照，则展示当前世界的主要事件分类扇区
  const wheelOptions: WheelOption[] = useMemo(() => {
    if (!session) return []

    if (session.lastSnapshot && session.lastSnapshot.sectors.length > 0) {
      return session.lastSnapshot.sectors.map((s) => ({
        id: s.id,
        name: s.title,
        label: s.title,
        description: s.title,
        weight: s.weight,
        value: s.id,
        probability: s.probability,
        color: s.color ?? '#38bdf8',
      }))
    }

    // 初始静止状态：使用世界全部可触发事件作为预选扇区
    return session.pack.events.slice(0, 10).map((e, index) => ({
      id: e.id,
      name: e.title,
      label: e.title,
      description: e.text,
      weight: 10,
      value: e.id,
      probability: 1 / Math.min(10, session.pack.events.length),
      color: `hsl(${(index * 360) / 10}, 65%, 45%)`,
    }))
  }, [session])

  if (!session) return null

  const lexicon = getWorldLexicon(session.pack.manifest.id)

  if (phase === 'ending') {
    return <EndingScreen />
  }

  const isAnimating = isSpinning
  const wheelStatus = isAnimating
    ? 'animating'
    : phase === 'event-choice'
    ? 'choice-pending'
    : 'ready'

  return (
    <div className="wol-game-screen">
      {/* 顶部状态与纪年栏 */}
      <StatusHeader2 />

      {/* 核心主视觉：命运轮盘 */}
      <main className="wol-wheel-container">
        <div className="wol-wheel-header">
          <span className="wol-wheel-eyebrow">{lexicon.wheel.eyebrow}</span>
          <h2 className="wol-wheel-title">{lexicon.wheel.title}</h2>
          <p className="wol-wheel-hint">{lexicon.wheel.hint}</p>
          <div className="wol-wheel-toolbar">
            <button
              type="button"
              className={`wol-tool-btn ${playMode === 'fast' ? 'wol-tool-btn--active' : ''}`}
              onClick={togglePlayMode}
              aria-label={playMode === 'fast' ? '切换为沉浸轮盘模式' : '切换为极速轮回模式'}
              title={playMode === 'fast' ? '当前：极速模式（跳过等待，秒级定格）' : '当前：沉浸轮盘模式（完整物理旋转动画）'}
            >
              {playMode === 'fast' ? '⚡ 极速模式' : '🎡 沉浸轮盘'}
            </button>
            <button
              type="button"
              className="wol-tool-btn"
              onClick={toggleSound}
              aria-label={soundMuted ? '开启音效' : '静音'}
              title={soundMuted ? '音效：已静音' : '音效：已开启'}
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>
            <button
              type="button"
              className="wol-tool-btn"
              onClick={() => setIsInspectorOpen(true)}
              aria-label="打开概率透视器"
            >
              🎲 概率透视
            </button>
            <button
              type="button"
              className="wol-tool-btn"
              onClick={() => setIsCodexOpen(true)}
              aria-label="打开人生图鉴"
            >
              📖 人生图鉴
            </button>
          </div>
        </div>

        <div className="wol-wheel-stage">
          <DestinyWheel
            options={wheelOptions}
            status={wheelStatus}
            onSpin={spinFateWheel}
            targetOptionId={targetSectorId}
            rotationDurationMs={playMode === 'fast' ? 0 : 2400}
            onRotationEnd={onSpinAnimationComplete}
          />
        </div>
      </main>

      {/* 底部属性、特质、背包、人生大事记折叠面板 */}
      <CharacterHUD />

      {/* 事件选择与因果结算弹窗 */}
      <EventModal />

      {/* 实时概率透视器 */}
      <ProbabilityInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* 跨局人生图鉴与死法收集册 */}
      <CodexScreen
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        initialWorldId={session.pack.manifest.id}
      />
    </div>
  )
}
