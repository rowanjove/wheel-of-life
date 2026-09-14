import { useState } from 'react'
import { getLexicon } from '../../../content/lexicon'
import { rewriteEndings } from '../../content/adapters'
import type { RewriteRun } from '../../engine/model'
import { contestRecordLabel, soulMasterTitle } from '../../engine/selectors'
import { occupiedBoneCount } from '../../engine/bones'
import { ConfirmRestartDialog } from '../dialogs/ConfirmRestartDialog'

type SummaryScreenProps = {
  run: RewriteRun
  onRestart(): void
}

export function SummaryScreen({ run, onRestart }: SummaryScreenProps) {
  const [confirming, setConfirming] = useState(false)
  const lex = getLexicon()
  const ending = rewriteEndings.find((candidate) => candidate.id === run.character.endingId)

  return (
    <main className="rewrite-summary">
      <p>人生终章</p>
      <h1>{ending?.name ?? '命运未明'}</h1>
      <h2>{ending?.title}</h2>
      <p>{ending?.comment}</p>
      <dl>
        <div><dt>主角</dt><dd>{run.character.name}</dd></div>
        <div><dt>最终等级</dt><dd>{run.character.level}级 · {soulMasterTitle(run.character.level)}</dd></div>
        <div><dt>精英大赛</dt><dd>{contestRecordLabel(run.character)}</dd></div>
        <div><dt>{lex.calendarName}</dt><dd>{run.character.currentYear}年</dd></div>
        <div><dt>{lex.ringLabel}</dt><dd>{run.character.rings.length}枚</dd></div>
        <div><dt>{lex.boneLabel}</dt><dd>{occupiedBoneCount(run.character)}块</dd></div>
        <div><dt>大陆声望</dt><dd>{run.character.relationships.reputation}</dd></div>
        <div><dt>传奇交锋</dt><dd>胜 {run.character.heroWins} / 负 {run.character.heroLosses}</dd></div>
        {run.character.titles.length > 0 ? (
          <div>
            <dt>称号</dt>
            <dd>{run.character.titles.join(' · ')}</dd>
          </div>
        ) : null}
        {run.character.schoolRecords.length > 0 ? (
          <div>
            <dt>学历</dt>
            <dd>{run.character.schoolRecords.map((record) => record.schoolName).join(' · ')}</dd>
          </div>
        ) : null}
      </dl>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)}>开始新人生</button>
      ) : (
        <ConfirmRestartDialog
          onConfirm={onRestart}
          onCancel={() => setConfirming(false)}
        />
      )}
    </main>
  )
}
