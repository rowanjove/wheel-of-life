import { useState } from 'react'
import { getLexicon } from '../../../content/lexicon'
import { rewriteTalents } from '../../content/adapters'
import type { RewriteCharacter } from '../../engine/model'
import { contestRecordLabel, selectAge, soulMasterTitle } from '../../engine/selectors'
import { ringQualityLabel } from '../../engine/rings'
import { mentorTrainingLabel } from '../../engine/schoolSelection'
import {
  normalizeBones,
  QUALITY_LABELS,
  SLOT_LABELS,
  BONE_SLOTS,
} from '../../engine/bones'
import { WingedGem } from '../decor/CelestialDecor'

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21">
      <path
        d="M20 11a8 8 0 1 0-2.34 5.66M20 5v6h-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function talentName(talentId: string | null): string {
  if (!talentId) return '无'
  return rewriteTalents.find((talent) => talent.id === talentId)?.name ?? '未知天赋'
}

type StatusHeaderProps = {
  character: RewriteCharacter
  onRefresh(): void
}

export function StatusHeader({ character, onRefresh }: StatusHeaderProps) {
  const [expanded, setExpanded] = useState(false)
  const lex = getLexicon()
  const age = selectAge(character)
  const displayName = character.name || '未命名'
  const spiritSummary = character.spirits.length > 0
    ? character.spirits.map((spirit) => spirit.name).join(' / ')
    : '尚未觉醒'
  const mentorLabel = mentorTrainingLabel(character.flags)

  return (
    <>
      <header className="rewrite-status-header">
        <div className="rewrite-status-header__character">
          <div className="rewrite-avatar" role="img" aria-label="角色头像">
            {displayName.slice(0, 1)}
          </div>
          <div className="rewrite-status-header__identity">
            <strong>{displayName} · {age}岁</strong>
            <span>{character.raceName || '命运尚未显现'} · {spiritSummary}</span>
          </div>
          <strong className="rewrite-level-badge">
            {Math.round(character.level)}级 · {soulMasterTitle(character.level)}
          </strong>
        </div>
        <div className="rewrite-status-header__crest">
          <WingedGem label="命运纹章" />
        </div>
        <div className="rewrite-status-header__chronicle">
          <span>当前纪年</span>
          <strong>{lex.calendarName} {character.currentYear}年</strong>
          <div className="rewrite-status-header__actions">
            <button
              type="button"
              className="rewrite-status-header__expand"
              aria-expanded={expanded}
              aria-label={expanded ? '收起角色详情' : '展开角色详情'}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? '收起' : '展开'}
            </button>
            <button type="button" aria-label="刷新游戏" onClick={onRefresh}>
              <RefreshIcon />
            </button>
          </div>
        </div>
      </header>
      {expanded ? (
        <aside className="rewrite-status-detail" aria-label="角色详情">
          <section>
            <h2>基础</h2>
            <dl>
              <div><dt>先天灵力</dt><dd>{character.innatePower}级</dd></div>
              <div><dt>天赋</dt><dd>{talentName(character.talentId)}</dd></div>
              <div><dt>颜值</dt><dd>{character.looks}/10</dd></div>
              <div><dt>出生地</dt><dd>{character.birthPlace || '未知'}</dd></div>
              <div><dt>大陆声望</dt><dd>{character.relationships.reputation}</dd></div>
              <div><dt>灵修称号</dt><dd>{soulMasterTitle(character.level)}</dd></div>
              <div><dt>精英大赛</dt><dd>{contestRecordLabel(character)}</dd></div>
              <div><dt>传奇战绩</dt><dd>{character.heroWins}胜 {character.heroLosses}负</dd></div>
              {mentorLabel ? (
                <div><dt>师承</dt><dd>{mentorLabel}</dd></div>
              ) : null}
            </dl>
          </section>
          <section>
            <h2>{lex.spiritLabel}</h2>
            <dl>
              <div><dt>数量</dt><dd>{character.spiritCount || '未定'}</dd></div>
              {character.spirits.map((spirit, index) => (
                <div key={spirit.id}>
                  <dt>{lex.spiritLabel}{index + 1}</dt>
                  <dd>{spirit.name}（{spirit.quality}）</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2>{lex.ringLabel}</h2>
            {character.rings.length === 0 ? (
              <p className="rewrite-status-detail__empty">尚未获得{lex.ringLabel}</p>
            ) : (
              <dl>
                {character.rings.map((ring) => (
                  <div key={ring.id}>
                    <dt>第{ring.index}环</dt>
                    <dd>
                      {ring.years.toLocaleString()}年 {ringQualityLabel(ring.quality)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          <section>
            <h2>{lex.boneLabel}</h2>
            <dl>
              {BONE_SLOTS.map((slot) => {
                const bone = normalizeBones(character.bones)[slot]
                return (
                  <div key={slot}>
                    <dt>{SLOT_LABELS[slot]}</dt>
                    <dd className={bone ? 'rewrite-status-detail__bone' : 'rewrite-status-detail__empty-slot'}>
                      {bone ? `${bone.name}（${QUALITY_LABELS[bone.quality]}）` : '空'}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </section>
          {character.schoolRecords.length > 0 ? (
            <section>
              <h2>学历</h2>
              <dl>
                {character.schoolRecords.map((record) => (
                  <div key={`${record.tier}-${record.schoolId}`}>
                    <dt>{record.tier === 'primary' ? '初级' : record.tier === 'middle' ? '中级' : '高级'}</dt>
                    <dd>{record.schoolName}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </aside>
      ) : null}
    </>
  )
}