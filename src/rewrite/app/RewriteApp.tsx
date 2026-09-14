import { useMemo, useState } from 'react'
import { useStore } from 'zustand'
import type { RewriteRun } from '../engine/model'
import { reduceRewriteRun } from '../engine/reducer'
import {
  createRewriteRepository,
  type RewriteRepository,
} from '../storage/repository'
import {
  createRewriteStore,
  type RewriteStoreDependencies,
} from '../store/gameStore'
import '../styles/tokens.css'
import '../styles/layout.css'
import '../styles/wheel.css'
import '../styles/dialogs.css'
import { GameShell } from '../ui/shell/GameShell'
import { RecoveryBoundary } from '../ui/shell/RecoveryBoundary'
import { createResilientStorage, createRuntimeId } from '../platform/runtime'
import { RewriteRouter } from './RewriteRouter'
import { WOLApp } from '../../engine/ui/WOLApp'

type RewriteAppProps = {
  repository?: RewriteRepository
  dependencies?: RewriteStoreDependencies
}

function defaultDependencies(): RewriteStoreDependencies {
  const dependencies = {
    now: () => new Date().toISOString(),
    nextId: createRuntimeId,
    nextSeed: () => Math.floor(Math.random() * 2_147_483_647) + 1,
  }
  return {
    ...dependencies,
    reduce: (run: RewriteRun, command) =>
      reduceRewriteRun(run, command, dependencies),
  }
}

export function RewriteApp({
  repository,
  dependencies,
}: RewriteAppProps = {}) {
  const [packEpoch, setPackEpoch] = useState(0)

  const activeRepository = useMemo(
    () => repository ?? createRewriteRepository(createResilientStorage(globalThis.localStorage)),
    [repository],
  )
  const activeDependencies = useMemo(
    () => dependencies ?? defaultDependencies(),
    [dependencies],
  )
  // Recreate store when pack changes so initializeRun re-binds packId.
  const store = useMemo(
    () => createRewriteStore(activeRepository, activeDependencies),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- packEpoch intentionally invalidates
    [activeDependencies, activeRepository, packEpoch],
  )
  const run = useStore(store, (state) => state.run)
  const history = useStore(store, (state) => state.history)
  const error = useStore(store, (state) => state.error)

  const [wol2Active, setWol2Active] = useState(() => {
    try {
      return (
        globalThis.localStorage?.getItem('wol_mode') === '2' ||
        new URLSearchParams(globalThis.location?.search).get('mode') === '2'
      )
    } catch {
      return false
    }
  })

  if (wol2Active) {
    return (
      <div className="wol-wrapper">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.4rem 1rem', background: '#0b0f19', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <button
            type="button"
            style={{
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #475569',
              borderRadius: 4,
              padding: '0.25rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
            onClick={() => {
              try {
                globalThis.localStorage?.setItem('wol_mode', '1')
              } catch {}
              setWol2Active(false)
            }}
          >
            ← 返回经典主题
          </button>
        </div>
        <WOLApp />
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.35rem 1rem', background: '#0b0f19', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <button
          type="button"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: '#0f172a',
            fontWeight: 600,
            border: 'none',
            borderRadius: 4,
            padding: '0.2rem 0.65rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
          onClick={() => {
            try {
              globalThis.localStorage?.setItem('wol_mode', '2')
            } catch {}
            setWol2Active(true)
          }}
        >
          ✨ 体验 2.0 多世界轮盘（修仙 / 武侠 / 都市）
        </button>
      </div>
      <GameShell
        character={run.character}
        history={history}
        onRefresh={() => store.getState().refresh()}
        showStatus={run.flow.step !== 'identity'}
        onPackChanged={() => {
          store.getState().restart()
          setPackEpoch((value) => value + 1)
        }}
      >
      <span hidden data-testid="pack-epoch">{packEpoch}</span>
      {error ? (
        <RecoveryBoundary
          error={new Error(error)}
          onRecover={() => store.getState().recover()}
          onReload={() => globalThis.location.reload()}
          onRestart={() => store.getState().restart()}
        />
      ) : (
        <RewriteRouter
          run={run}
          dispatch={(command) => store.getState().dispatch(command)}
          onRestart={() => store.getState().restart()}
        />
      )}
    </GameShell>
    </>
  )
}
