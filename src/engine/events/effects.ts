import type { CharacterState, InventoryItem, WorldState } from '../core/model'
import { addMemory } from './memory'
import { scheduleEvent } from './scheduler'
import type { Effect } from './schema'

export interface EffectApplyResult {
  character: CharacterState
  world?: WorldState
  queuedEvents: string[]
  endingTriggered?: { endingId: string; reason?: string }
}

/**
 * 执行单个 Effect 并返回更新后的状态
 */
export function applyEffect(
  character: CharacterState,
  effect: Effect,
  world?: WorldState,
): EffectApplyResult {
  let updatedChar = { ...character }
  let updatedWorld = world ? { ...world } : undefined
  const queuedEvents: string[] = []
  let endingTriggered: { endingId: string; reason?: string } | undefined

  switch (effect.type) {
    case 'modify_stat': {
      const cur = updatedChar.stats[effect.key] ?? 0
      updatedChar = {
        ...updatedChar,
        stats: {
          ...updatedChar.stats,
          [effect.key]: cur + effect.value,
        },
      }
      break
    }
    case 'set_stat': {
      updatedChar = {
        ...updatedChar,
        stats: {
          ...updatedChar.stats,
          [effect.key]: effect.value,
        },
      }
      break
    }
    case 'modify_status': {
      const statusMap = updatedChar.status ? { ...updatedChar.status } : {}
      const cur = statusMap[effect.key] ?? 0
      statusMap[effect.key] = cur + effect.value
      updatedChar = {
        ...updatedChar,
        status: statusMap,
      }
      break
    }
    case 'add_talent': {
      if (!updatedChar.talents.includes(effect.talentId)) {
        updatedChar = {
          ...updatedChar,
          talents: [...updatedChar.talents, effect.talentId],
        }
      }
      break
    }
    case 'remove_talent': {
      updatedChar = {
        ...updatedChar,
        talents: updatedChar.talents.filter((t) => t !== effect.talentId),
      }
      break
    }
    case 'add_trait': {
      if (!updatedChar.traits.includes(effect.traitId)) {
        updatedChar = {
          ...updatedChar,
          traits: [...updatedChar.traits, effect.traitId],
        }
      }
      break
    }
    case 'remove_trait': {
      updatedChar = {
        ...updatedChar,
        traits: updatedChar.traits.filter((t) => t !== effect.traitId),
      }
      break
    }
    case 'add_item': {
      const existing = updatedChar.inventory.find((i) => i.id === effect.itemId)
      const qtyToAdd = effect.quantity ?? 1
      if (existing) {
        updatedChar = {
          ...updatedChar,
          inventory: updatedChar.inventory.map((i) =>
            i.id === effect.itemId
              ? { ...i, quantity: (i.quantity ?? 1) + qtyToAdd }
              : i,
          ),
        }
      } else {
        const newItem: InventoryItem = {
          id: effect.itemId,
          name: effect.name ?? effect.itemId,
          type: 'item',
          quantity: qtyToAdd,
        }
        updatedChar = {
          ...updatedChar,
          inventory: [...updatedChar.inventory, newItem],
        }
      }
      break
    }
    case 'remove_item': {
      const qtyToRemove = effect.quantity ?? 1
      const existing = updatedChar.inventory.find((i) => i.id === effect.itemId)
      if (existing) {
        const curQty = existing.quantity ?? 1
        if (curQty <= qtyToRemove) {
          updatedChar = {
            ...updatedChar,
            inventory: updatedChar.inventory.filter((i) => i.id !== effect.itemId),
          }
        } else {
          updatedChar = {
            ...updatedChar,
            inventory: updatedChar.inventory.map((i) =>
              i.id === effect.itemId ? { ...i, quantity: curQty - qtyToRemove } : i,
            ),
          }
        }
      }
      break
    }
    case 'add_flag': {
      if (!updatedChar.flags.includes(effect.flag)) {
        updatedChar = {
          ...updatedChar,
          flags: [...updatedChar.flags, effect.flag],
        }
      }
      break
    }
    case 'remove_flag': {
      updatedChar = {
        ...updatedChar,
        flags: updatedChar.flags.filter((f) => f !== effect.flag),
      }
      break
    }
    case 'add_memory': {
      updatedChar = addMemory(
        updatedChar,
        effect.memoryType,
        'effect-action',
        effect.tags ?? [],
        effect.data,
      )
      break
    }
    case 'modify_relation': {
      const cur = updatedChar.relationships[effect.target] ?? 0
      updatedChar = {
        ...updatedChar,
        relationships: {
          ...updatedChar.relationships,
          [effect.target]: cur + effect.value,
        },
      }
      break
    }
    case 'modify_faction': {
      const cur = updatedChar.factionRelations[effect.faction] ?? 0
      updatedChar = {
        ...updatedChar,
        factionRelations: {
          ...updatedChar.factionRelations,
          [effect.faction]: cur + effect.value,
        },
      }
      break
    }
    case 'queue_event': {
      queuedEvents.push(effect.eventId)
      break
    }
    case 'schedule_event': {
      const delayYears =
        effect.delayYears ??
        (effect.delayMonths ? Math.max(1, Math.floor(effect.delayMonths / 12)) : 1)
      updatedChar = scheduleEvent(updatedChar, effect.eventId, delayYears, {
        sourceEventId: 'effect-action',
      })
      break
    }
    case 'advance_age': {
      const newMonths = (updatedChar.months ?? updatedChar.age * 12) + effect.months
      const newAge = Math.floor(newMonths / 12)
      const yearDiff = newAge - updatedChar.age
      updatedChar = {
        ...updatedChar,
        months: newMonths,
        age: newAge,
        currentYear: updatedChar.currentYear + yearDiff,
      }
      break
    }
    case 'trigger_ending': {
      updatedChar = {
        ...updatedChar,
        alive: false,
        causeOfDeath: effect.reason ?? '命运落幕',
      }
      endingTriggered = {
        endingId: effect.endingId,
        reason: effect.reason,
      }
      break
    }
  }

  return {
    character: updatedChar,
    world: updatedWorld,
    queuedEvents,
    endingTriggered,
  }
}

/**
 * 批量顺序应用 Effects
 */
export function applyEffects(
  character: CharacterState,
  effects: Effect[] = [],
  world?: WorldState,
): EffectApplyResult {
  let curChar = character
  let curWorld = world
  const allQueued: string[] = []
  let ending: { endingId: string; reason?: string } | undefined

  for (const eff of effects) {
    const res = applyEffect(curChar, eff, curWorld)
    curChar = res.character
    curWorld = res.world
    if (res.queuedEvents.length > 0) {
      allQueued.push(...res.queuedEvents)
    }
    if (res.endingTriggered) {
      ending = res.endingTriggered
    }
  }

  return {
    character: curChar,
    world: curWorld,
    queuedEvents: allQueued,
    endingTriggered: ending,
  }
}
