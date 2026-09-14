import { useEffect, useState } from 'react'
import { worldRegistry } from '../../worlds/loader'
import { useLifeStore } from '../store/lifeStore'
import { CodexScreen } from './CodexScreen'
import { getWorldLexicon } from './worldLexicon'
import './ui.css'

export function CreationScreen() {
  const [isCodexOpen, setIsCodexOpen] = useState(false)
  const {
    creation,
    setWorld,
    updateCreationName,
    selectOrigin,
    toggleTalent,
    updateStat,
    autoAllocateStats,
    confirmCreationAndStart,
    playMode,
    setPlayMode,
  } = useLifeStore()

  useEffect(() => {
    if (!creation.selectedOriginId) {
      setWorld('wuxia')
    }
  }, [creation.selectedOriginId, setWorld])

  const packs = worldRegistry.list()
  const currentPack = worldRegistry.get(creation.selectedWorldId) ?? packs[0]

  if (!currentPack) {
    return <div className="wol-loading">正在载入世界包...</div>
  }

  const lexicon = getWorldLexicon(creation.selectedWorldId)
  const origins = currentPack.origins
  const talents = currentPack.talents.filter((t) => creation.drawnTalentIds.includes(t.id))
  const stats = currentPack.stats

  return (
    <div className="wol-creation-screen">
      <header className="wol-creation-header">
        <h1 className="wol-creation-title">{lexicon.creation.title}</h1>
        <p className="wol-creation-subtitle">{lexicon.creation.subtitle}</p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`wol-tool-btn ${playMode === 'standard' ? 'wol-tool-btn--active' : ''}`}
            onClick={() => setPlayMode('standard')}
            aria-label="选择沉浸轮盘模式"
          >
            🎡 沉浸轮盘
          </button>
          <button
            type="button"
            className={`wol-tool-btn ${playMode === 'fast' ? 'wol-tool-btn--active' : ''}`}
            onClick={() => setPlayMode('fast')}
            aria-label="选择极速轮回模式"
          >
            ⚡ 极速轮回
          </button>
          <button
            type="button"
            className="wol-tool-btn"
            onClick={() => setIsCodexOpen(true)}
            aria-label="打开人生图鉴"
          >
            📖 人生图鉴与死法册
          </button>
        </div>
      </header>

      <div className="wol-creation-body">
        {/* 1. 世界选择 */}
        <section className="wol-section">
          <h2 className="wol-section-title">{lexicon.creation.worldSectionTitle}</h2>
          <div className="wol-world-tabs">
            {packs.map((p) => (
              <button
                key={p.manifest.id}
                type="button"
                className={`wol-world-tab ${
                  creation.selectedWorldId === p.manifest.id ? 'active' : ''
                }`}
                onClick={() => setWorld(p.manifest.id)}
              >
                <strong>{p.manifest.name}</strong>
                <span>{p.manifest.tone}</span>
              </button>
            ))}
          </div>
          <p className="wol-world-desc">{currentPack.manifest.description}</p>
        </section>

        {/* 2. 姓名与出身 */}
        <section className="wol-section">
          <h2 className="wol-section-title">{lexicon.creation.identitySectionTitle}</h2>
          <div className="wol-input-row">
            <label htmlFor="char-name">今生姓名：</label>
            <input
              id="char-name"
              type="text"
              value={creation.name}
              placeholder={lexicon.creation.namePlaceholder}
              onChange={(e) => updateCreationName(e.target.value)}
              className="wol-text-input"
              maxLength={12}
            />
          </div>

          <div className="wol-origins-grid">
            {origins.map((orig) => (
              <button
                key={orig.id}
                type="button"
                className={`wol-origin-card ${
                  creation.selectedOriginId === orig.id ? 'selected' : ''
                }`}
                onClick={() => selectOrigin(orig.id)}
              >
                <div className="wol-origin-card-title">{orig.name}</div>
                <div className="wol-origin-card-desc">{orig.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 3. 先天天赋六选三 */}
        <section className="wol-section">
          <div className="wol-section-header">
            <h2 className="wol-section-title">{lexicon.creation.talentsSectionTitle}</h2>
            <span className="wol-badge-count">
              已选 {creation.selectedTalentIds.length} / 3
            </span>
          </div>
          <p className="wol-section-hint" style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
            {lexicon.creation.talentsSubtitle}
          </p>
          <div className="wol-talents-grid">
            {talents.map((t) => {
              const isSelected = creation.selectedTalentIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`wol-talent-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTalent(t.id)}
                >
                  <div className="wol-talent-header">
                    <strong>{t.name}</strong>
                    <span className={`wol-rarity r-${t.rarity ?? 1}`}>
                      {t.rarity === 3 ? '史诗' : t.rarity === 2 ? '稀有' : '普通'}
                    </span>
                  </div>
                  <p>{t.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* 4. 属性自由点数分配 */}
        <section className="wol-section">
          <div className="wol-section-header">
            <h2 className="wol-section-title">{lexicon.creation.statsSectionTitle}</h2>
            <div className="wol-points-box">
              剩余可用点数：<strong>{creation.remainingPoints}</strong>
              <div className="wol-quick-btn-group">
                <button
                  type="button"
                  className="wol-small-btn"
                  onClick={() => autoAllocateStats('random')}
                >
                  随机分配
                </button>
                <button
                  type="button"
                  className="wol-small-btn"
                  onClick={() => autoAllocateStats('average')}
                >
                  平均分配
                </button>
              </div>
            </div>
          </div>
          <p className="wol-section-hint" style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
            {lexicon.creation.statsSubtitle}
          </p>

          <div className="wol-stats-alloc-list">
            {stats.map((s) => {
              const curVal = creation.allocatedStats[s.id] ?? s.initial
              const canMinus = curVal > s.initial
              const canPlus = creation.remainingPoints > 0 && curVal < s.max
              return (
                <div key={s.id} className="wol-stat-alloc-row">
                  <div className="wol-stat-name">
                    <strong>{s.name}</strong>
                    <span>{s.description}</span>
                  </div>
                  <div className="wol-stat-controls">
                    <button
                      type="button"
                      disabled={!canMinus}
                      onClick={() => updateStat(s.id, -1)}
                      className="wol-stepper-btn"
                    >
                      -
                    </button>
                    <span className="wol-stat-val">{curVal}</span>
                    <button
                      type="button"
                      disabled={!canPlus}
                      onClick={() => updateStat(s.id, 1)}
                      className="wol-stepper-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <footer className="wol-creation-footer">
        <button
          type="button"
          className="wol-primary-cta"
          onClick={confirmCreationAndStart}
        >
          {lexicon.creation.startButton}
        </button>
      </footer>

      <CodexScreen
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        initialWorldId={creation.selectedWorldId}
      />
    </div>
  )
}
