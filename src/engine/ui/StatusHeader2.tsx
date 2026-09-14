import { useLifeStore } from '../store/lifeStore'

export function StatusHeader2() {
  const { session, restartLife } = useLifeStore()
  if (!session) return null

  const { character, pack } = session
  const stats = character.stats

  // 计算当前阶段
  const stages = pack.manifest.stages ?? []
  const currentStage =
    stages.find(
      (st) =>
        (st.minAge === undefined || character.age >= st.minAge) &&
        (st.maxAge === undefined || character.age <= st.maxAge),
    )?.name ?? '流年'

  return (
    <header className="wol-status-header">
      <div className="wol-header-left">
        <div className="wol-avatar">{character.name.slice(0, 1)}</div>
        <div className="wol-char-meta">
          <div className="wol-char-name-row">
            <strong className="wol-name">{character.name}</strong>
            <span className="wol-world-tag">{pack.manifest.name}</span>
            <span className="wol-stage-tag">{currentStage}</span>
          </div>
          <div className="wol-char-time">
            <span>{character.age} 岁</span>
            <span className="wol-dot">·</span>
            <span>{character.currentYear} 年</span>
            <span className="wol-dot">·</span>
            <span>经历 {character.months ?? character.age * 12} 月</span>
          </div>
        </div>
      </div>

      <div className="wol-header-stats">
        {Object.entries(stats).slice(0, 4).map(([k, v]) => {
          const statDef = pack.stats.find((s) => s.id === k)
          const name = statDef?.name ?? k
          return (
            <div key={k} className="wol-stat-pill">
              <span className="wol-stat-pill-label">{name}</span>
              <strong className="wol-stat-pill-val">{v}</strong>
            </div>
          )
        })}
      </div>

      <div className="wol-header-right">
        <button
          type="button"
          className="wol-restart-btn"
          title="放弃本局并重新开始人生"
          onClick={() => {
            if (globalThis.confirm('确定放弃当前人生，重新开启新轮回吗？')) {
              restartLife()
            }
          }}
        >
          重新轮回
        </button>
      </div>
    </header>
  )
}
