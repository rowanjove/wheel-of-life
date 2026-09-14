import { useState, useMemo } from 'react'
import { inspectCandidatePool } from '../fate/fateResolver'
import { useLifeStore } from '../store/lifeStore'

interface ProbabilityInspectorProps {
  isOpen: boolean
  onClose: () => void
}

export function ProbabilityInspector({ isOpen, onClose }: ProbabilityInspectorProps) {
  const { session } = useLifeStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  const poolData = useMemo(() => {
    if (!session) return null
    return inspectCandidatePool(
      session.library,
      session.queue,
      session.character,
      session.world,
      {
        streakTracker: session.streakTracker,
        itemDefinitions: session.pack.items,
        currentMonth: session.character.months ?? session.character.age * 12,
        wheelMode: session.pack.manifest.wheelMode,
      },
    )
  }, [session])

  if (!isOpen || !session || !poolData) return null

  const categories = ['all', ...Array.from(new Set(poolData.candidates.map((c) => c.category ?? 'other')))]

  const filteredCandidates = poolData.candidates
    .filter((c) => selectedCategory === 'all' || (c.category ?? 'other') === selectedCategory)
    .sort((a, b) => b.weight - a.weight)

  return (
    <div className="wol-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="wol-inspector-modal"
        onClick={(e) => e.stopPropagation()}
        aria-label="概率透视器"
      >
        <div className="wol-inspector-header">
          <div>
            <span className="wol-inspector-eyebrow">命运引擎 2.0 审计工具</span>
            <h3 className="wol-inspector-title">概率透视器 (Probability Inspector)</h3>
          </div>
          <button
            type="button"
            className="wol-close-btn"
            onClick={onClose}
            aria-label="关闭概率透视器"
          >
            ✕
          </button>
        </div>

        {/* 保底与防连击状态栏 */}
        {poolData.pityStatus && (
          <div className="wol-pity-hud">
            <div className="wol-pity-card">
              <span className="wol-pity-label">机缘保底机制</span>
              <strong className="wol-pity-val">
                连续 {poolData.pityStatus.opportunityDroughtTurns} 轮未遇机缘
              </strong>
              <span className="wol-pity-sub">
                加成倍率: {poolData.pityStatus.opportunityMultiplier.toFixed(2)}x
                {poolData.pityStatus.opportunityMultiplier > 1.0 && ' (保底生效中 🔥)'}
              </span>
            </div>
            <div className="wol-pity-card">
              <span className="wol-pity-label">高危防暴毙保护</span>
              <strong className="wol-pity-val">
                距上次危机 {poolData.pityStatus.recentCrisisTurns} 轮
              </strong>
              <span className="wol-pity-sub">
                危机发生率: {poolData.pityStatus.crisisMultiplier.toFixed(2)}x
                {poolData.pityStatus.crisisMultiplier < 1.0 && ' (防连续保护中 🛡️)'}
              </span>
            </div>
          </div>
        )}

        {/* 分类过滤 */}
        <div className="wol-filter-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`wol-filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? '全部候选' : cat}
            </button>
          ))}
        </div>

        {/* 候选事件列表 */}
        <div className="wol-candidates-list">
          <div className="wol-pool-summary">
            共 {filteredCandidates.length} 个合法候选事件 · 总权重: {poolData.totalWeight.toFixed(1)}
          </div>

          {filteredCandidates.map((candidate) => {
            const bd = poolData.breakdowns[candidate.id]
            const isExpanded = expandedEventId === candidate.id

            return (
              <div
                key={candidate.id}
                className={`wol-candidate-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedEventId(isExpanded ? null : candidate.id)}
              >
                <div className="wol-candidate-main">
                  <div className="wol-candidate-info">
                    <span className="wol-candidate-title">{candidate.title}</span>
                    {candidate.category && (
                      <span className="wol-candidate-cat">{candidate.category}</span>
                    )}
                  </div>
                  <div className="wol-candidate-metrics">
                    <span className="wol-candidate-pct">{candidate.percentage}</span>
                    <span className="wol-candidate-wt">权重 {candidate.weight.toFixed(1)}</span>
                  </div>
                </div>

                {/* 概率可视化条 */}
                <div className="wol-prob-bar-track">
                  <div
                    className="wol-prob-bar-fill"
                    style={{ width: `${(candidate.probability * 100).toFixed(1)}%` }}
                  />
                </div>

                {/* 展开的详细修正链路 */}
                {isExpanded && bd && (
                  <div className="wol-candidate-breakdown">
                    <div className="wol-bd-row">
                      <span>基础权重 (Base Weight):</span>
                      <strong>{bd.baseWeight}</strong>
                    </div>

                    {bd.entries && bd.entries.length > 0 ? (
                      <div className="wol-bd-modifiers">
                        <span className="wol-bd-subheading">动态加权链路 (Modifier Pipeline):</span>
                        {bd.entries.map((entry, idx) => (
                          <div
                            key={idx}
                            className={`wol-bd-mod-item ${entry.applied ? 'applied' : 'not-met'}`}
                          >
                            <span className="wol-mod-source">{entry.source}</span>
                            <span className="wol-mod-effect">
                              {entry.mode === 'multiply' ? `×${entry.value}` : `+${entry.value}`}
                            </span>
                            <span className="wol-mod-status">
                              {entry.applied ? '✓ 已生效' : '✗ 未满足'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="wol-bd-empty">此事件使用静态权重，无动态修饰符</div>
                    )}

                    <div className="wol-bd-row wol-bd-final">
                      <span>最终归一化前权重 (Final Weight):</span>
                      <strong>{bd.finalWeight}</strong>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
