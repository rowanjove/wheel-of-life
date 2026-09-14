import { useState, useMemo } from 'react'
import { modernWorldPack } from '../../worlds/modern'
import { wuxiaWorldPack } from '../../worlds/wuxia'
import { xianxiaWorldPack } from '../../worlds/xianxia'
import { worldRegistry } from '../../worlds/loader'
import type { WorldPack } from '../../worlds/packTypes'
import { getCodexProgress, loadCodex } from '../legacy/codex'

try {
  worldRegistry.register(modernWorldPack)
  worldRegistry.register(wuxiaWorldPack)
  worldRegistry.register(xianxiaWorldPack)
} catch {
  // Ignore duplicate
}

interface CodexScreenProps {
  isOpen: boolean
  onClose: () => void
  initialWorldId?: string
}

type CodexTab = 'events' | 'talents' | 'traits' | 'items' | 'endings' | 'deaths'

export function CodexScreen({ isOpen, onClose, initialWorldId = 'all' }: CodexScreenProps) {
  const [selectedWorldId, setSelectedWorldId] = useState<string>(initialWorldId)
  const [activeTab, setActiveTab] = useState<CodexTab>('events')

  const codex = useMemo(() => loadCodex(), [isOpen])

  const packs = useMemo(() => {
    return worldRegistry.list()
  }, [])

  const currentPack: WorldPack | undefined = useMemo(() => {
    if (selectedWorldId === 'all') return undefined
    return worldRegistry.get(selectedWorldId) ?? modernWorldPack
  }, [selectedWorldId])

  const progress = useMemo(() => {
    return getCodexProgress(codex, currentPack)
  }, [codex, currentPack])

  if (!isOpen) return null

  return (
    <div className="wol-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="wol-codex-modal"
        onClick={(e) => e.stopPropagation()}
        aria-label="人生图鉴与死法收集册"
      >
        <div className="wol-codex-header">
          <div>
            <span className="wol-codex-eyebrow">跨 局 传 承 · 轮 回 沉 淀</span>
            <h3 className="wol-codex-title">人生图鉴与死法收集册 (Life Codex)</h3>
          </div>
          <button
            type="button"
            className="wol-close-btn"
            onClick={onClose}
            aria-label="关闭图鉴"
          >
            ✕
          </button>
        </div>

        {/* 顶部统计卡片 */}
        <div className="wol-codex-stats-row">
          <div className="wol-codex-stat-item">
            <span className="label">总轮回次数</span>
            <strong className="val">{codex.totalRuns} 次</strong>
          </div>
          <div className="wol-codex-stat-item">
            <span className="label">累计流转光阴</span>
            <strong className="val">{codex.totalYearsSimulated} 年</strong>
          </div>
          <div className="wol-codex-stat-item">
            <span className="label">最高寿元纪录</span>
            <strong className="val">{codex.maxLifespan} 岁</strong>
          </div>
          <div className="wol-codex-stat-item">
            <span className="label">当前世界收集度</span>
            <strong className="val highlight">
              {'percentage' in progress ? progress.percentage : `${progress.totalUnlocked} 处印记`}
            </strong>
          </div>
        </div>

        {/* 世界切换选择 */}
        <div className="wol-codex-world-selector">
          <button
            type="button"
            className={`wol-codex-world-btn ${selectedWorldId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedWorldId('all')}
          >
            全部世界
          </button>
          {packs.map((p) => (
            <button
              key={p.manifest.id}
              type="button"
              className={`wol-codex-world-btn ${selectedWorldId === p.manifest.id ? 'active' : ''}`}
              onClick={() => setSelectedWorldId(p.manifest.id)}
            >
              {p.manifest.name}
            </button>
          ))}
        </div>

        {/* 分类标签栏 */}
        <div className="wol-codex-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'events'}
            className={`wol-codex-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            际遇纪事 ({progress.events.unlocked}{'total' in progress.events ? `/${progress.events.total}` : ''})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'talents'}
            className={`wol-codex-tab ${activeTab === 'talents' ? 'active' : ''}`}
            onClick={() => setActiveTab('talents')}
          >
            先天天赋 ({progress.talents.unlocked}{'total' in progress.talents ? `/${progress.talents.total}` : ''})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'traits'}
            className={`wol-codex-tab ${activeTab === 'traits' ? 'active' : ''}`}
            onClick={() => setActiveTab('traits')}
          >
            后天特质 ({progress.traits.unlocked}{'total' in progress.traits ? `/${progress.traits.total}` : ''})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'items'}
            className={`wol-codex-tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            万物百宝 ({progress.items.unlocked}{'total' in progress.items ? `/${progress.items.total}` : ''})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'endings'}
            className={`wol-codex-tab ${activeTab === 'endings' ? 'active' : ''}`}
            onClick={() => setActiveTab('endings')}
          >
            终局结局 ({progress.endings.unlocked}{'total' in progress.endings ? `/${progress.endings.total}` : ''})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'deaths'}
            className={`wol-codex-tab ${activeTab === 'deaths' ? 'active' : ''}`}
            onClick={() => setActiveTab('deaths')}
          >
            死法集册 ({progress.deaths.unlocked})
          </button>
        </div>

        {/* 内容展示区 */}
        <div className="wol-codex-grid">
          {/* 1. 际遇纪事 */}
          {activeTab === 'events' && (
            (currentPack ? currentPack.events : Object.values(codex.unlockedEvents)).map((ev) => {
              const isUnlocked = currentPack ? Boolean(codex.unlockedEvents[ev.id]) : true
              const title = isUnlocked ? ('title' in ev ? ev.title : ev.name) : '？？？？？？'
              const text = isUnlocked ? ('text' in ev ? ev.text : '曾经经历的命运轨迹') : '尚未在转盘中触发此际遇'
              return (
                <div key={'id' in ev ? ev.id : (ev as { id: string }).id} className={`wol-codex-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="wol-codex-card-head">
                    <span className="wol-codex-card-title">{title}</span>
                    {isUnlocked && <span className="wol-codex-badge">已解锁</span>}
                  </div>
                  <p className="wol-codex-card-desc">{text}</p>
                </div>
              )
            })
          )}

          {/* 2. 先天天赋 */}
          {activeTab === 'talents' && (
            (currentPack ? currentPack.talents : Object.values(codex.unlockedTalents)).map((t) => {
              const isUnlocked = currentPack ? Boolean(codex.unlockedTalents[t.id]) : true
              const name = isUnlocked ? t.name : '？？？？？？'
              const desc = isUnlocked ? ('description' in t ? t.description : '开局先天造化') : '尚未抽取并觉醒该先天道种'
              return (
                <div key={t.id} className={`wol-codex-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="wol-codex-card-head">
                    <span className="wol-codex-card-title">{name}</span>
                    {isUnlocked && <span className="wol-codex-badge">已觉醒</span>}
                  </div>
                  <p className="wol-codex-card-desc">{desc}</p>
                </div>
              )
            })
          )}

          {/* 3. 后天特质 */}
          {activeTab === 'traits' && (
            (currentPack ? currentPack.traits : Object.values(codex.unlockedTraits)).map((tr) => {
              const isUnlocked = currentPack ? Boolean(codex.unlockedTraits[tr.id]) : true
              const name = isUnlocked ? tr.name : '？？？？？？'
              const desc = isUnlocked ? ('description' in tr ? tr.description : '后天磨砺造化') : '尚未在人生中历练获得'
              return (
                <div key={tr.id} className={`wol-codex-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="wol-codex-card-head">
                    <span className="wol-codex-card-title">{name}</span>
                    {isUnlocked && <span className="wol-codex-badge">已习得</span>}
                  </div>
                  <p className="wol-codex-card-desc">{desc}</p>
                </div>
              )
            })
          )}

          {/* 4. 万物百宝 */}
          {activeTab === 'items' && (
            (currentPack ? currentPack.items : Object.values(codex.unlockedItems)).map((it) => {
              const isUnlocked = currentPack ? Boolean(codex.unlockedItems[it.id]) : true
              const name = isUnlocked ? it.name : '？？？？？？'
              const desc = isUnlocked ? ('description' in it ? it.description : '随身神物遗宝') : '行囊未曾收纳此物'
              return (
                <div key={it.id} className={`wol-codex-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="wol-codex-card-head">
                    <span className="wol-codex-card-title">{name}</span>
                    {isUnlocked && <span className="wol-codex-badge">已收纳</span>}
                  </div>
                  <p className="wol-codex-card-desc">{desc}</p>
                </div>
              )
            })
          )}

          {/* 5. 终局结局 */}
          {activeTab === 'endings' && (
            (currentPack ? currentPack.endings : Object.values(codex.unlockedEndings)).map((ed) => {
              const isUnlocked = currentPack ? Boolean(codex.unlockedEndings[ed.id]) : true
              const title = isUnlocked ? ('title' in ed ? ed.title : ed.name) : '？？？？？？'
              const desc = isUnlocked ? ('description' in ed ? ed.description : '一段人生的圆满落幕') : '尚未达成此宿命终局'
              return (
                <div key={ed.id} className={`wol-codex-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="wol-codex-card-head">
                    <span className="wol-codex-card-title">{title}</span>
                    {isUnlocked && <span className="wol-codex-badge">已通达</span>}
                  </div>
                  <p className="wol-codex-card-desc">{desc}</p>
                </div>
              )
            })
          )}

          {/* 6. 死法集册 */}
          {activeTab === 'deaths' && (
            <div className="wol-deaths-container">
              {codex.deathCompendium.length === 0 ? (
                <div className="wol-empty-codex">暂未记录任何死因，人生福寿绵长。</div>
              ) : (
                codex.deathCompendium
                  .filter((d) => selectedWorldId === 'all' || d.worldId === selectedWorldId)
                  .map((d, idx) => (
                    <div key={idx} className="wol-death-item">
                      <div className="wol-death-icon">💀</div>
                      <div className="wol-death-info">
                        <strong className="wol-death-cause">{d.cause}</strong>
                        <span className="wol-death-meta">
                          【{d.characterName}】殁于 {d.age} 岁 · 世界: {d.worldId ?? '未知'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
