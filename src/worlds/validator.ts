import type { Condition } from '../engine/events/conditions'
import type { Effect, EventDefinition, EventOption } from '../engine/events/schema'
import type { WorldPack } from './packTypes'

export interface DiagnosticIssue {
  severity: 'error' | 'warning'
  category: 'unreachable' | 'impossible_condition' | 'missing_reference' | 'dead_end' | 'circular_queue'
  entity: 'event' | 'option' | 'talent' | 'trait' | 'item' | 'origin'
  id: string
  message: string
}

export interface PackDiagnosisReport {
  packId: string
  packName: string
  isHealthy: boolean
  errorsCount: number
  warningsCount: number
  issues: DiagnosticIssue[]
}

/**
 * 递归检查 Condition 中是否存在自相矛盾或无法达成的逻辑
 */
function checkConditionReachability(
  cond: Condition,
  pack: WorldPack,
  eventId: string,
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = []

  // 1. 检查年龄区间逻辑矛盾 (如 gte > lte)
  if ('age' in cond && cond.age) {
    if (typeof cond.age === 'number') {
      if (cond.age < 0) {
        issues.push({
          severity: 'error',
          category: 'impossible_condition',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】设定了不可能达成的年龄要求: age === ${cond.age} (< 0)`,
        })
      }
    } else if ('gte' in cond.age || 'lte' in cond.age || 'gt' in cond.age || 'lt' in cond.age) {
      const { gte, lte, gt, lt } = cond.age
      const minAge = gte ?? (gt !== undefined ? gt + 1 : undefined)
      const maxAge = lte ?? (lt !== undefined ? lt - 1 : undefined)
      if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
        issues.push({
          severity: 'error',
          category: 'impossible_condition',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】存在逻辑矛盾的年龄区间: [${minAge}, ${maxAge}]`,
        })
      }
    } else if ('op' in cond.age) {
      if (cond.age.op === '<' && cond.age.value <= 0) {
        issues.push({
          severity: 'error',
          category: 'impossible_condition',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】设定了不可能达成的年龄要求: age < ${cond.age.value}`,
        })
      }
    }
  }

  // 2. 检查属性门槛是否超出属性定义的最大值
  if ('stat' in cond && cond.stat) {
    const statDef = pack.stats.find((s) => s.id === cond.stat)
    if (!statDef) {
      issues.push({
        severity: 'error',
        category: 'missing_reference',
        entity: 'event',
        id: eventId,
        message: `事件【${eventId}】检定中引用了未定义的属性【${cond.stat}】`,
      })
    } else {
      if ((cond.op === '>' || cond.op === '>=') && cond.value > statDef.max) {
        issues.push({
          severity: 'error',
          category: 'impossible_condition',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】要求属性【${statDef.name}】>= ${cond.value}，超过了上限 ${statDef.max}`,
        })
      }
    }
  }

  // 3. 检查天赋引用
  if ('talent' in cond && cond.talent) {
    const hasTalent = pack.talents.some((t) => t.id === cond.talent)
    if (!hasTalent) {
      issues.push({
        severity: 'error',
        category: 'missing_reference',
        entity: 'event',
        id: eventId,
        message: `事件【${eventId}】要求的天赋【${cond.talent}】在当前世界包中不存在`,
      })
    }
  }

  // 4. 检查特质引用
  if ('trait' in cond && cond.trait) {
    const hasTrait = pack.traits.some((t) => t.id === cond.trait)
    if (!hasTrait) {
      issues.push({
        severity: 'error',
        category: 'missing_reference',
        entity: 'event',
        id: eventId,
        message: `事件【${eventId}】要求的特质【${cond.trait}】在当前世界包中不存在`,
      })
    }
  }

  // 5. 检查复合逻辑 all / any
  if ('all' in cond && cond.all) {
    // 检查是否有直接相反的条件 (如 trait: 'x' 与 not: { trait: 'x' })
    const traitsRequired = new Set<string>()
    const traitsForbidden = new Set<string>()

    for (const sub of cond.all) {
      if ('trait' in sub && sub.trait) traitsRequired.add(sub.trait)
      if ('not' in sub && sub.not && 'trait' in sub.not && sub.not.trait) {
        traitsForbidden.add(sub.not.trait)
      }
      issues.push(...checkConditionReachability(sub, pack, eventId))
    }

    for (const t of traitsRequired) {
      if (traitsForbidden.has(t)) {
        issues.push({
          severity: 'error',
          category: 'impossible_condition',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】要求同时包含且不包含特质【${t}】，永远不可达`,
        })
      }
    }
  }

  if ('any' in cond && cond.any) {
    for (const sub of cond.any) {
      issues.push(...checkConditionReachability(sub, pack, eventId))
    }
  }

  if ('not' in cond && cond.not) {
    issues.push(...checkConditionReachability(cond.not, pack, eventId))
  }

  return issues
}

/**
 * 校验 Effect 引用合法性
 */
function checkEffectReferences(effects: Effect[], pack: WorldPack, eventId: string): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = []
  const allEvents = new Set(pack.events.map((e) => e.id))
  const allItems = new Set(pack.items.map((i) => i.id))
  const allTraits = new Set(pack.traits.map((t) => t.id))

  for (const eff of effects) {
    if (eff.type === 'queue_event' && eff.eventId) {
      if (!allEvents.has(eff.eventId)) {
        issues.push({
          severity: 'error',
          category: 'missing_reference',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】尝试排队不存在的事件【${eff.eventId}】`,
        })
      }
      // 检查自死循环 (自身无条件排队自身)
      if (eff.eventId === eventId) {
        issues.push({
          severity: 'warning',
          category: 'circular_queue',
          entity: 'event',
          id: eventId,
          message: `事件【${eventId}】排队了自身，可能导致无休止死循环`,
        })
      }
    }

    if (eff.type === 'add_item') {
      const itemId = eff.itemId
      if (itemId && !allItems.has(itemId)) {
        issues.push({
          severity: 'warning',
          category: 'missing_reference',
          entity: 'item',
          id: itemId,
          message: `事件【${eventId}】奖励了未在 pack.items 中登记的物品【${itemId}】`,
        })
      }
    }

    if (eff.type === 'add_trait') {
      const traitId = eff.traitId
      if (traitId && !allTraits.has(traitId)) {
        issues.push({
          severity: 'warning',
          category: 'missing_reference',
          entity: 'trait',
          id: traitId,
          message: `事件【${eventId}】赋予了未在 pack.traits 中登记的特质【${traitId}】`,
        })
      }
    }
  }

  return issues
}

/**
 * 对 WorldPack 执行全量不可达诊断与静态结构审计
 */
export function diagnoseWorldPack(pack: WorldPack): PackDiagnosisReport {
  const issues: DiagnosticIssue[] = []

  // 1. 检查出身配置
  const allTraits = new Set(pack.traits.map((t) => t.id))
  const allItems = new Set(pack.items.map((i) => i.id))

  for (const origin of pack.origins) {
    if (origin.initialTraits) {
      for (const tId of origin.initialTraits) {
        if (!allTraits.has(tId)) {
          issues.push({
            severity: 'error',
            category: 'missing_reference',
            entity: 'origin',
            id: origin.id,
            message: `出身【${origin.name}】引用了未定义的特质【${tId}】`,
          })
        }
      }
    }

    if (origin.initialItems) {
      for (const iId of origin.initialItems) {
        if (!allItems.has(iId)) {
          issues.push({
            severity: 'warning',
            category: 'missing_reference',
            entity: 'origin',
            id: origin.id,
            message: `出身【${origin.name}】附带了未在 items 中定义的物品【${iId}】`,
          })
        }
      }
    }
  }

  // 2. 检查事件池可达性与结构
  for (const ev of pack.events) {
    // 检查事件触发条件
    if (ev.conditions) {
      issues.push(...checkConditionReachability(ev.conditions, pack, ev.id))
    }

    // 检查直接效果引用
    if (ev.directEffects) {
      issues.push(...checkEffectReferences(ev.directEffects, pack, ev.id))
    }

    // 检查选项与分支
    if (ev.options) {
      if (ev.options.length === 0) {
        issues.push({
          severity: 'warning',
          category: 'dead_end',
          entity: 'event',
          id: ev.id,
          message: `事件【${ev.title}】定义了 options 字段但数组为空`,
        })
      }

      for (const opt of ev.options) {
        if (opt.conditions) {
          issues.push(...checkConditionReachability(opt.conditions, pack, `${ev.id}#${opt.id}`))
        }
        if (opt.effects) {
          issues.push(...checkEffectReferences(opt.effects, pack, `${ev.id}#${opt.id}`))
        }
        if (opt.branches) {
          for (const b of opt.branches) {
            if (b.condition) {
              issues.push(...checkConditionReachability(b.condition, pack, `${ev.id}#${opt.id}`))
            }
            if (b.effects) {
              issues.push(...checkEffectReferences(b.effects, pack, `${ev.id}#${opt.id}`))
            }
          }
        }
      }
    }
  }

  const errorsCount = issues.filter((i) => i.severity === 'error').length
  const warningsCount = issues.filter((i) => i.severity === 'warning').length

  return {
    packId: pack.manifest.id,
    packName: pack.manifest.name,
    isHealthy: errorsCount === 0,
    errorsCount,
    warningsCount,
    issues,
  }
}
