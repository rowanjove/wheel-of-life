import { useEffect, useRef, useState } from 'react'
import { loadCodex, recordSessionToCodex } from '../legacy/codex'
import { useLifeStore } from '../store/lifeStore'
import { CodexScreen } from './CodexScreen'
import { getWorldLexicon } from './worldLexicon'

export function EndingScreen() {
  const { session, restartLife } = useLifeStore()
  const [isCodexOpen, setIsCodexOpen] = useState(false)
  const recordedRef = useRef(false)

  useEffect(() => {
    if (session && !recordedRef.current) {
      recordedRef.current = true
      recordSessionToCodex(loadCodex(), session.character, session.pack, session.ending)
    }
  }, [session])

  if (!session) return null

  const { character, pack } = session
  const ending = session.ending
  const lexicon = getWorldLexicon(pack.manifest.id)

  return (
    <div className="wol-ending-screen">
      <div className="wol-ending-card">
        <header className="wol-ending-header">
          <span className="wol-ending-tag">{lexicon.ending.tag}</span>
          <h1 className="wol-ending-title">{ending?.title ?? lexicon.ending.defaultTitle}</h1>
          <p className="wol-ending-reason">{character.causeOfDeath ?? ending?.reason ?? '生命自然终结'}</p>
        </header>

        <div className="wol-ending-stats-summary">
          <div className="wol-ending-stat-box">
            <span className="label">{lexicon.ending.ageLabel}</span>
            <strong className="val">{character.age} {lexicon.hud.ageUnit}</strong>
          </div>
          <div className="wol-ending-stat-box">
            <span className="label">{lexicon.ending.timeLabel}</span>
            <strong className="val">{character.months ?? character.age * 12} 个月</strong>
          </div>
          <div className="wol-ending-stat-box">
            <span className="label">{lexicon.ending.historyLabel}</span>
            <strong className="val">{character.history.length} 次</strong>
          </div>
          <div className="wol-ending-stat-box">
            <span className="label">{lexicon.ending.inventoryLabel}</span>
            <strong className="val">{character.inventory.length} 件</strong>
          </div>
        </div>

        <section className="wol-ending-final-stats">
          <h3 className="wol-ending-subhead">终局能力总览</h3>
          <div className="wol-ending-stats-list">
            {pack.stats.map((s) => (
              <div key={s.id} className="wol-ending-stat-row">
                <span>{s.name}</span>
                <strong>{character.stats[s.id] ?? s.initial}</strong>
              </div>
            ))}
          </div>
        </section>

        <footer className="wol-ending-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="wol-restart-cta"
            onClick={restartLife}
          >
            {lexicon.ending.restartButton}
          </button>
          <button
            type="button"
            className="wol-tool-btn"
            onClick={() => setIsCodexOpen(true)}
          >
            📖 查看跨局人生图鉴
          </button>
        </footer>
      </div>

      <CodexScreen
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        initialWorldId={pack.manifest.id}
      />
    </div>
  )
}
