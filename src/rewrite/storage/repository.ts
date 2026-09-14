import { RUN_VERSION, type HistoryEntry, type RewriteRun } from '../engine/model'
import { isValidSnapshot, validateRun } from './validation'
import { createRuntimeId } from '../platform/runtime'

/** Current storage keys (open-source branding). */
export const CURRENT_RUN_KEY = 'game-life:current-run-v1'
export const PLAY_HISTORY_KEY = 'game-life:play-history-v1'

/** Legacy keys from pre-open-source builds — migrated on first access. */
const LEGACY_RUN_KEY = 'douluo-current-run-v1'
const LEGACY_HISTORY_KEY = 'douluo-play-history-v1'

export const MAX_PLAY_HISTORY_ENTRIES = 500

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): unknown
  removeItem(key: string): unknown
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function parseHistory(raw: string | null): HistoryEntry[] {
  const parsed = parseJson(raw)
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((entry): entry is HistoryEntry => (
      !!entry &&
      typeof entry === 'object' &&
      typeof entry.id === 'string' &&
      typeof entry.runId === 'string' &&
      typeof entry.at === 'string' &&
      typeof entry.type === 'string' &&
      typeof entry.summary === 'string'
    ))
    .map((entry) => ({ ...entry }))
}

function migrateLegacyKeys(storage: StorageLike): void {
  if (!storage.getItem(CURRENT_RUN_KEY)) {
    const legacy = storage.getItem(LEGACY_RUN_KEY)
    if (legacy) {
      storage.setItem(CURRENT_RUN_KEY, legacy)
      storage.removeItem(LEGACY_RUN_KEY)
    }
  }
  if (!storage.getItem(PLAY_HISTORY_KEY)) {
    const legacy = storage.getItem(LEGACY_HISTORY_KEY)
    if (legacy) {
      storage.setItem(PLAY_HISTORY_KEY, legacy)
      storage.removeItem(LEGACY_HISTORY_KEY)
    }
  }
}

export function createRewriteRepository(storage: StorageLike) {
  migrateLegacyKeys(storage)

  const repository = {
    loadRun(): RewriteRun | null {
      const result = validateRun(parseJson(storage.getItem(CURRENT_RUN_KEY)))
      return result.ok ? result.run : null
    },
    saveRun(run: RewriteRun): RewriteRun {
      const result = validateRun(run)
      if (!result.ok) throw new Error(result.reason)
      storage.setItem(CURRENT_RUN_KEY, JSON.stringify(result.run))
      return result.run
    },
    loadRecoverableRun(options?: {
      expectedPackId?: string
    }): {
      run: RewriteRun
      source: 'current' | 'snapshot'
    } | null {
      const parsed = parseJson(storage.getItem(CURRENT_RUN_KEY))
      const current = validateRun(parsed)
      if (current.ok) {
        if (
          options?.expectedPackId &&
          current.run.packId !== options.expectedPackId
        ) {
          return null
        }
        return { run: current.run, source: 'current' }
      }
      if (!parsed || typeof parsed !== 'object') return null

      const candidate = parsed as Partial<RewriteRun>
      if (!isValidSnapshot(candidate.snapshot)) return null
      const recovered: RewriteRun = {
        version: RUN_VERSION,
        id: typeof candidate.id === 'string' ? candidate.id : createRuntimeId(),
        seed: Number.isInteger(candidate.seed) ? candidate.seed! : 1,
        rngCursor: candidate.snapshot.rngCursor,
        createdAt: typeof candidate.createdAt === 'string'
          ? candidate.createdAt
          : candidate.snapshot.createdAt,
        updatedAt: candidate.snapshot.createdAt,
        packId: typeof candidate.packId === 'string' ? candidate.packId : 'base',
        packVersion: typeof candidate.packVersion === 'string'
          ? candidate.packVersion
          : '0.0.0',
        character: candidate.snapshot.character,
        flow: candidate.snapshot.flow,
        stack: candidate.snapshot.stack,
        pending: null,
        history: Array.isArray(candidate.history) ? candidate.history : [],
        snapshot: candidate.snapshot,
        creation: candidate.snapshot.creation,
      }
      if (
        options?.expectedPackId &&
        recovered.packId !== options.expectedPackId
      ) {
        return null
      }
      const validation = validateRun(recovered)
      return validation.ok ? { run: validation.run, source: 'snapshot' } : null
    },
    loadHistory(): HistoryEntry[] {
      return parseHistory(storage.getItem(PLAY_HISTORY_KEY))
    },
    appendHistory(entry: HistoryEntry) {
      const history = repository.loadHistory()
      const next = [...history, { ...entry }]
      const trimmed = next.length > MAX_PLAY_HISTORY_ENTRIES
        ? next.slice(-MAX_PLAY_HISTORY_ENTRIES)
        : next
      storage.setItem(PLAY_HISTORY_KEY, JSON.stringify(trimmed))
    },
    archiveAndRestart(nextRun: RewriteRun): RewriteRun {
      const current = repository.loadRecoverableRun()?.run
      if (current) {
        repository.appendHistory({
          id: `${nextRun.id}:restart`,
          runId: current.id,
          at: nextRun.createdAt,
          type: 'run-restart',
          summary: `结束“${current.character.name || '未命名人生'}”，开始新人生`,
        })
      }
      return repository.saveRun(nextRun)
    },
  }

  return repository
}

export type RewriteRepository = ReturnType<typeof createRewriteRepository>
