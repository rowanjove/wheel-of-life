import { create } from 'zustand'
import { modernWorldPack } from '../../worlds/modern'
import { wuxiaWorldPack } from '../../worlds/wuxia'
import { xianxiaWorldPack } from '../../worlds/xianxia'
import { worldRegistry } from '../../worlds/loader'
import type { WorldPack } from '../../worlds/packTypes'
import {
  initWorldLife,
  stepGenericLife,
  type GenericLifeSession,
  type GenericStepResult,
} from '../core/genericLifeSim'
import { applyEffects } from '../events/effects'
import type { Effect } from '../events/schema'
import type { StatMap } from '../core/model'
import { soundManager } from '../audio/soundManager'

// 确保世界包已注册（古代世界优先）
try {
  worldRegistry.register(wuxiaWorldPack)
  worldRegistry.register(xianxiaWorldPack)
  worldRegistry.register(modernWorldPack)
} catch {
  // Ignore duplicate registration in HMR
}

export type UIPhase =
  | 'creation' // 开局配置（选世界、出身、天赋、加点）
  | 'wheel' // 命运轮盘主界面
  | 'event-choice' // 等待玩家做选择
  | 'event-result' // 展示选择/即时事件结果
  | 'ending' // 终局结算

export interface LifeStoreState {
  worldId: string
  session: GenericLifeSession | null
  phase: UIPhase
  isSpinning: boolean
  targetSectorId: string | null
  lastResult?: GenericStepResult
  playMode: 'standard' | 'fast'
  soundMuted: boolean

  // 开局配置临时状态
  creation: {
    selectedWorldId: string
    name: string
    selectedOriginId: string
    drawnTalentIds: string[]
    selectedTalentIds: string[]
    allocatedStats: StatMap
    remainingPoints: number
  }

  // 动作
  setWorld(worldId: string): void
  startCreation(worldId?: string): void
  updateCreationName(name: string): void
  selectOrigin(originId: string): void
  toggleTalent(talentId: string): void
  updateStat(statKey: string, delta: number): void
  autoAllocateStats(mode: 'random' | 'average'): void
  confirmCreationAndStart(): void

  setPlayMode(mode: 'standard' | 'fast'): void
  togglePlayMode(): void
  toggleSound(): void
  fastAutoStep(): void

  spinFateWheel(): void
  onSpinAnimationComplete(): void
  pickEventOption(optionId: string): void
  dismissResultModal(): void
  useInventoryItem(itemId: string): { success: boolean; message: string }
  restartLife(): void
}

function getActivePack(worldId: string): WorldPack {
  return worldRegistry.get(worldId) ?? wuxiaWorldPack
}

export const useLifeStore = create<LifeStoreState>((set, get) => {
  const initialPack = wuxiaWorldPack
  const initialOrigin = initialPack.origins[0]
  const initialDrawn = initialPack.talents.slice(0, 6).map((t) => t.id)
  const initialSelected = initialDrawn.slice(0, 3)
  const initialStats: StatMap = {}
  for (const s of initialPack.stats) {
    initialStats[s.id] = s.initial
  }

  return {
    worldId: 'wuxia',
    session: null,
    phase: 'creation',
    isSpinning: false,
    targetSectorId: null,
    playMode: (() => {
      try {
        return (globalThis.localStorage?.getItem('wol_play_mode') as 'standard' | 'fast') || 'standard'
      } catch {
        return 'standard'
      }
    })(),
    soundMuted: soundManager.isMuted(),

    creation: {
      selectedWorldId: 'wuxia',
      name: '沈炼',
      selectedOriginId: initialOrigin?.id ?? 'origin-martial-hall',
      drawnTalentIds: initialDrawn,
      selectedTalentIds: initialSelected,
      allocatedStats: initialStats,
      remainingPoints: initialPack.manifest.initialPoints ?? 25,
    },

    setWorld: (worldId: string) => {
      const pack = getActivePack(worldId)
      const origin = pack.origins[0]
      const drawn = pack.talents.slice(0, 6).map((t) => t.id)
      const selectedTalents = drawn.slice(0, 3)

      const initialAllocated: StatMap = {}
      for (const s of pack.stats) {
        initialAllocated[s.id] = s.initial
      }

      set({
        worldId,
        creation: {
          selectedWorldId: worldId,
          name: worldId === 'xianxia' ? '叶清歌' : worldId === 'wuxia' ? '沈炼' : '张明',
          selectedOriginId: origin?.id ?? '',
          drawnTalentIds: drawn,
          selectedTalentIds: selectedTalents,
          allocatedStats: initialAllocated,
          remainingPoints: pack.manifest.initialPoints ?? 20,
        },
      })
    },

    startCreation: (worldId = 'wuxia') => {
      get().setWorld(worldId)
      set({ phase: 'creation', session: null })
    },

  updateCreationName: (name: string) => {
    set((state) => ({ creation: { ...state.creation, name } }))
  },

  selectOrigin: (originId: string) => {
    set((state) => ({ creation: { ...state.creation, selectedOriginId: originId } }))
  },

  toggleTalent: (talentId: string) => {
    set((state) => {
      const cur = state.creation.selectedTalentIds
      if (cur.includes(talentId)) {
        return {
          creation: {
            ...state.creation,
            selectedTalentIds: cur.filter((id) => id !== talentId),
          },
        }
      }
      if (cur.length >= 3) {
        return state // 最多选 3 个
      }
      return {
        creation: {
          ...state.creation,
          selectedTalentIds: [...cur, talentId],
        },
      }
    })
  },

  updateStat: (statKey: string, delta: number) => {
    set((state) => {
      const { allocatedStats, remainingPoints, selectedWorldId } = state.creation
      const pack = getActivePack(selectedWorldId)
      const statDef = pack.stats.find((s) => s.id === statKey)
      if (!statDef) return state

      const curVal = allocatedStats[statKey] ?? statDef.initial

      if (delta > 0 && remainingPoints > 0 && curVal < statDef.max) {
        const actualDelta = Math.min(delta, remainingPoints, statDef.max - curVal)
        return {
          creation: {
            ...state.creation,
            allocatedStats: {
              ...allocatedStats,
              [statKey]: curVal + actualDelta,
            },
            remainingPoints: remainingPoints - actualDelta,
          },
        }
      }
      if (delta < 0 && curVal > statDef.initial) {
        const actualDelta = Math.min(-delta, curVal - statDef.initial)
        return {
          creation: {
            ...state.creation,
            allocatedStats: {
              ...allocatedStats,
              [statKey]: curVal - actualDelta,
            },
            remainingPoints: remainingPoints + actualDelta,
          },
        }
      }
      return state
    })
  },

  autoAllocateStats: (mode: 'random' | 'average') => {
    const { selectedWorldId, remainingPoints, allocatedStats } = get().creation
    const pack = getActivePack(selectedWorldId)

    // 清零已分配的点数回到初始
    let totalPoints = remainingPoints
    for (const s of pack.stats) {
      const added = (allocatedStats[s.id] ?? s.initial) - s.initial
      totalPoints += added
    }

    const initialStats = { ...allocatedStats }
    for (const s of pack.stats) {
      initialStats[s.id] = s.initial
    }

    let left = totalPoints
    if (mode === 'average') {
      const perStat = Math.floor(left / pack.stats.length)
      for (const s of pack.stats) {
        const canAdd = Math.min(perStat, s.max - initialStats[s.id])
        initialStats[s.id] += canAdd
        left -= canAdd
      }
    } else {
      // 随机分配
      while (left > 0) {
        const s = pack.stats[Math.floor(Math.random() * pack.stats.length)]
        if (initialStats[s.id] < s.max) {
          initialStats[s.id] += 1
          left -= 1
        }
      }
    }

    set((state) => ({
      creation: {
        ...state.creation,
        allocatedStats: initialStats,
        remainingPoints: left,
      },
    }))
  },

  confirmCreationAndStart: () => {
    const { selectedWorldId, name, selectedOriginId, selectedTalentIds, allocatedStats } =
      get().creation
    const pack = getActivePack(selectedWorldId)

    const session = initWorldLife(pack, Date.now(), {
      name,
      originId: selectedOriginId,
      chosenTalentIds: selectedTalentIds,
      allocatedStats,
    })

    set({
      session,
      worldId: selectedWorldId,
      phase: 'wheel',
      isSpinning: false,
      targetSectorId: null,
      lastResult: undefined,
    })
  },

  setPlayMode: (mode: 'standard' | 'fast') => {
    try {
      globalThis.localStorage?.setItem('wol_play_mode', mode)
    } catch {}
    set({ playMode: mode })
  },

  togglePlayMode: () => {
    const next = get().playMode === 'standard' ? 'fast' : 'standard'
    get().setPlayMode(next)
  },

  toggleSound: () => {
    const muted = soundManager.toggleMute()
    set({ soundMuted: muted })
  },

  fastAutoStep: () => {
    const { phase, session } = get()
    if (session?.isFinished) {
      set({ phase: 'ending' })
      return
    }
    if (phase === 'event-result') {
      get().dismissResultModal()
      if (!get().session?.isFinished) {
        get().spinFateWheel()
      }
    } else if (phase === 'wheel') {
      get().spinFateWheel()
    }
  },

  spinFateWheel: () => {
    const { session, isSpinning, phase, playMode } = get()
    if (!session || isSpinning || session.isFinished || phase !== 'wheel') return

    // 推进一步计算命运
    const stepRes = stepGenericLife(session)
    const targetId = stepRes.session.lastSnapshot?.selectedSectorId ?? null

    if (playMode === 'standard') {
      soundManager.startWheelSpin(2400)
    }

    set({
      session: stepRes.session,
      isSpinning: true,
      targetSectorId: targetId,
      lastResult: stepRes,
    })
  },

  onSpinAnimationComplete: () => {
    const { session, lastResult, playMode } = get()
    if (!session || !lastResult) return

    soundManager.stopWheelSpin()

    // 播放结果反馈音效
    const event = lastResult.activeEvent
    if (event?.category === 'opportunity' || event?.category === 'special') {
      soundManager.playOpportunity()
    } else if (event?.category === 'crisis') {
      soundManager.playCrisis()
    } else if (playMode === 'standard') {
      soundManager.playTick(1.2)
    }

    if (session.isFinished) {
      set({ isSpinning: false, phase: 'ending' })
      return
    }

    if (session.pendingEvent && session.pendingEvent.options && session.pendingEvent.options.length > 0) {
      set({ isSpinning: false, phase: 'event-choice' })
    } else {
      set({ isSpinning: false, phase: 'event-result' })
    }
  },

  pickEventOption: (optionId: string) => {
    const { session } = get()
    if (!session || !session.pendingEvent) return

    const stepRes = stepGenericLife(session, optionId)

    if (stepRes.session.isFinished) {
      set({
        session: stepRes.session,
        lastResult: stepRes,
        phase: 'ending',
      })
      return
    }

    set({
      session: stepRes.session,
      lastResult: stepRes,
      phase: 'event-result',
    })
  },

  dismissResultModal: () => {
    const { session } = get()
    if (session?.isFinished) {
      set({ phase: 'ending' })
    } else {
      set({ phase: 'wheel' })
    }
  },

  useInventoryItem: (itemId: string) => {
    const { session } = get()
    if (!session || session.isFinished) {
      return { success: false, message: '当前人生未在进行中' }
    }

    const itemIdx = session.character.inventory.findIndex((i) => i.id === itemId)
    if (itemIdx === -1) {
      return { success: false, message: '背包中未找到该物品' }
    }

    const item = session.character.inventory[itemIdx]
    const itemDef = session.pack.items.find((i) => i.id === itemId)

    let updatedChar = { ...session.character }
    let updatedWorld = { ...session.world }

    // 1. 如果物品有直接效果，执行生效
    if (itemDef?.effects && (itemDef.effects as Effect[]).length > 0) {
      const effRes = applyEffects(updatedChar, itemDef.effects as Effect[], updatedWorld)
      updatedChar = effRes.character
      if (effRes.world) updatedWorld = effRes.world
      for (const qe of effRes.queuedEvents) {
        session.queue.push(qe)
      }
    }

    // 2. 消耗数量或移除物品
    const currentQty = item.quantity ?? 1
    let nextInventory = [...updatedChar.inventory]
    if (currentQty > 1) {
      nextInventory[itemIdx] = {
        ...item,
        quantity: currentQty - 1,
      }
    } else {
      nextInventory = nextInventory.filter((_, idx) => idx !== itemIdx)
    }

    const itemName = itemDef?.name ?? item.name ?? itemId
    updatedChar = {
      ...updatedChar,
      inventory: nextInventory,
      history: [
        ...updatedChar.history,
        {
          age: updatedChar.age,
          year: updatedChar.currentYear,
          title: `使用物品【${itemName}】`,
          description: itemDef?.description ?? '随身行囊物件消耗。',
          type: 'event',
        },
      ],
    }

    set({
      session: {
        ...session,
        character: updatedChar,
        world: updatedWorld,
      },
    })

    return { success: true, message: `已使用【${itemName}】` }
  },

  restartLife: () => {
    get().startCreation(get().worldId)
  },
}
})
