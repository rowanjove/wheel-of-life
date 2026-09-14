import type { WorldPack } from './packTypes'

export interface ValidationError {
  type: 'duplicate_id' | 'missing_reference' | 'invalid_config'
  entity: string
  id: string
  message: string
}

export function validateWorldPack(pack: WorldPack): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  // 1. 校验 Manifest
  if (!pack.manifest || !pack.manifest.id || !pack.manifest.name) {
    errors.push({
      type: 'invalid_config',
      entity: 'manifest',
      id: pack.manifest?.id ?? 'unknown',
      message: 'WorldPack manifest 必须包含有效 id 和 name',
    })
  }

  // 2. 检查各模块 ID 唯一性
  function checkUnique(items: { id: string }[], entityName: string) {
    const ids = new Set<string>()
    for (const item of items) {
      if (ids.has(item.id)) {
        errors.push({
          type: 'duplicate_id',
          entity: entityName,
          id: item.id,
          message: `${entityName} 中存在重复 ID: ${item.id}`,
        })
      }
      ids.add(item.id)
    }
  }

  checkUnique(pack.stats, 'stats')
  checkUnique(pack.talents, 'talents')
  checkUnique(pack.traits, 'traits')
  checkUnique(pack.items, 'items')
  checkUnique(pack.origins, 'origins')
  checkUnique(pack.factions, 'factions')
  checkUnique(pack.events, 'events')
  checkUnique(pack.endings, 'endings')

  // 3. 校验天赋互斥引用合法性
  const talentIds = new Set(pack.talents.map((t) => t.id))
  for (const talent of pack.talents) {
    if (talent.incompatible) {
      for (const incomp of talent.incompatible) {
        if (!talentIds.has(incomp)) {
          errors.push({
            type: 'missing_reference',
            entity: 'talent',
            id: talent.id,
            message: `天赋【${talent.name}】引用的互斥天赋 ID【${incomp}】不存在`,
          })
        }
      }
    }
  }

  // 4. 校验特质替换引用合法性
  const traitIds = new Set(pack.traits.map((t) => t.id))
  for (const trait of pack.traits) {
    if (trait.replacements) {
      for (const rep of trait.replacements) {
        if (!traitIds.has(rep)) {
          errors.push({
            type: 'missing_reference',
            entity: 'trait',
            id: trait.id,
            message: `特质【${trait.name}】引用的替换特质 ID【${rep}】不存在`,
          })
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

class WorldRegistry {
  private packs: Map<string, WorldPack> = new Map()

  public register(pack: WorldPack): void {
    const result = validateWorldPack(pack)
    if (!result.valid) {
      const msgs = result.errors.map((e) => `[${e.type}] ${e.message}`).join('; ')
      throw new Error(`Failed to register WorldPack '${pack.manifest.id}': ${msgs}`)
    }
    this.packs.set(pack.manifest.id, pack)
  }

  public get(id: string): WorldPack | undefined {
    return this.packs.get(id)
  }

  public list(): WorldPack[] {
    return Array.from(this.packs.values())
  }

  public clear(): void {
    this.packs.clear()
  }
}

export const worldRegistry = new WorldRegistry()
