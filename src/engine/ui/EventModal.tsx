import { useEffect } from 'react'
import { evaluateCondition } from '../events/conditions'
import { useLifeStore } from '../store/lifeStore'
import { getWorldLexicon } from './worldLexicon'

export function EventModal() {
  const { phase, session, lastResult, pickEventOption, dismissResultModal, playMode } = useLifeStore()

  const isChoicePhase = phase === 'event-choice'

  useEffect(() => {
    if (phase !== 'event-result') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        dismissResultModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, dismissResultModal])

  if (!session || (phase !== 'event-choice' && phase !== 'event-result')) {
    return null
  }

  const { character, world } = session
  const activeEvent = session.pendingEvent ?? lastResult?.activeEvent

  if (!activeEvent) return null

  const lexicon = getWorldLexicon(session.pack.manifest.id)
  const categoryKey = activeEvent.category ?? 'daily'
  const categoryLabel =
    lexicon.modal.categoryLabels[categoryKey] ?? '命运际会'

  return (
    <div className="wol-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wol-modal-card">
        <header className="wol-modal-header">
          <span className="wol-event-category-pill">
            {categoryLabel}
          </span>
          <h2 className="wol-modal-title">{activeEvent.title}</h2>
        </header>

        <div className="wol-modal-body">
          {/* 事件叙事正文 */}
          <p className="wol-event-text">{activeEvent.text}</p>

          {/* 阶段 1：等待玩家做出决策 */}
          {isChoicePhase && activeEvent.options && (
            <div className="wol-options-list">
              <h3 className="wol-options-heading">{lexicon.modal.choiceHeading}</h3>
              {activeEvent.options.map((opt) => {
                const isMet = opt.conditions
                  ? evaluateCondition(opt.conditions, { character, world })
                  : true

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!isMet}
                    className={`wol-option-btn ${!isMet ? 'disabled' : ''}`}
                    onClick={() => pickEventOption(opt.id)}
                  >
                    <span className="wol-option-text">{opt.text}</span>
                    {!isMet && <span className="wol-lock-hint">（前置条件未满足）</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* 阶段 2：展示抉择后的结果与因果反馈 */}
          {!isChoicePhase && (
            <div className="wol-result-box">
              <div className="wol-result-badge">{lexicon.modal.resultBadge}</div>
              <p className="wol-result-text">
                {lastResult?.feedbackText || lexicon.modal.defaultFeedback}
              </p>
            </div>
          )}
        </div>

        {!isChoicePhase && (
          <footer className="wol-modal-footer">
            <button
              type="button"
              className="wol-continue-btn"
              onClick={dismissResultModal}
            >
              {lexicon.modal.continueButton} {playMode === 'fast' ? '⚡(空格/回车)' : ''}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
