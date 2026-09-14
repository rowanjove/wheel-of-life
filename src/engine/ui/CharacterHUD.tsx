import { useState } from 'react'
import { useLifeStore } from '../store/lifeStore'
import { getWorldLexicon } from './worldLexicon'

type HUDTab = 'stats' | 'traits' | 'inventory' | 'history'

export function CharacterHUD() {
  const [activeTab, setActiveTab] = useState<HUDTab>('stats')
  const { session } = useLifeStore()

  if (!session) return null
  const { character, pack } = session
  const lexicon = getWorldLexicon(pack.manifest.id)

  return (
    <aside className="wol-hud-panel" aria-label="角色状态与背包">
      <div className="wol-hud-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stats'}
          className={`wol-hud-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          {lexicon.hud.statsTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'traits'}
          className={`wol-hud-tab ${activeTab === 'traits' ? 'active' : ''}`}
          onClick={() => setActiveTab('traits')}
        >
          {lexicon.hud.traitsTab} ({character.talents.length + character.traits.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'inventory'}
          className={`wol-hud-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          {lexicon.hud.inventoryTab} ({character.inventory.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`wol-hud-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {lexicon.hud.historyTab} ({character.history.length})
        </button>
      </div>

      <div className="wol-hud-content">
        {/* 属性面板 */}
        {activeTab === 'stats' && (
          <div className="wol-stats-grid">
            {pack.stats.map((s) => {
              const val = character.stats[s.id] ?? s.initial
              const percent = Math.min(100, Math.max(0, ((val - s.min) / (s.max - s.min)) * 100))
              return (
                <div key={s.id} className="wol-stat-card">
                  <div className="wol-stat-card-header">
                    <span className="wol-stat-card-title">{s.name}</span>
                    <strong className="wol-stat-card-val">{val}</strong>
                  </div>
                  <div className="wol-stat-bar-track">
                    <div className="wol-stat-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="wol-stat-card-desc">{s.description}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* 天赋与特质面板 */}
        {activeTab === 'traits' && (
          <div className="wol-traits-panel">
            <div className="wol-sub-section">
              <h4 className="wol-sub-title">先天天赋</h4>
              <div className="wol-badge-list">
                {character.talents.length === 0 && <span className="wol-empty">无先天天赋</span>}
                {character.talents.map((tId) => {
                  const tDef = pack.talents.find((t) => t.id === tId)
                  return (
                    <div key={tId} className="wol-talent-pill">
                      <strong>{tDef?.name ?? tId}</strong>
                      <span>{tDef?.description}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="wol-sub-section">
              <h4 className="wol-sub-title">后天经历与特质</h4>
              <div className="wol-badge-list">
                {character.traits.length === 0 && <span className="wol-empty">暂未获得后天特质</span>}
                {character.traits.map((trId) => {
                  const trDef = pack.traits.find((t) => t.id === trId)
                  return (
                    <div key={trId} className="wol-trait-pill">
                      <strong>{trDef?.name ?? trId}</strong>
                      <span>{trDef?.description}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 背包物品面板 */}
        {activeTab === 'inventory' && (
          <div className="wol-inventory-panel">
            {character.inventory.length === 0 && (
              <div className="wol-empty-inventory">行囊空空如也，前路漫漫。</div>
            )}
            <div className="wol-inventory-grid">
              {character.inventory.map((item) => {
                const itemDef = pack.items.find((i) => i.id === item.id)
                const isUsable =
                  itemDef?.type === 'consumable' ||
                  item.type === 'consumable' ||
                  Boolean(itemDef?.effects && itemDef.effects.length > 0)
                const hasRadiation =
                  itemDef?.eventWeightModifiers && itemDef.eventWeightModifiers.length > 0

                return (
                  <div key={item.id} className="wol-item-card">
                    <div className="wol-item-header">
                      <strong>{item.name ?? itemDef?.name ?? item.id}</strong>
                      <span className="wol-item-qty">x{item.quantity ?? 1}</span>
                    </div>
                    <p className="wol-item-desc">{itemDef?.description ?? '未知随身物件'}</p>

                    {hasRadiation && (
                      <div className="wol-item-radiation">
                        {itemDef?.eventWeightModifiers?.map((m, idx) => (
                          <span key={idx} className="wol-radiation-tag">
                            ✨ 命运加权: {m.tag ?? m.category ?? m.eventId} ×{m.multiplier}
                          </span>
                        ))}
                      </div>
                    )}

                    {isUsable && (
                      <div className="wol-item-actions">
                        <button
                          type="button"
                          className="wol-item-use-btn"
                          onClick={() => {
                            const res = useLifeStore.getState().useInventoryItem(item.id)
                            if (!res.success) {
                              alert(res.message)
                            }
                          }}
                        >
                          使用
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 大事记面板 */}
        {activeTab === 'history' && (
          <div className="wol-history-timeline">
            {[...character.history].reverse().map((h, idx) => (
              <div key={idx} className="wol-history-entry">
                <div className="wol-history-time">
                  {h.age}岁 · {h.year}年
                </div>
                <div className="wol-history-body">
                  <strong className="wol-history-title">{h.title}</strong>
                  {h.description && <p className="wol-history-desc">{h.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
