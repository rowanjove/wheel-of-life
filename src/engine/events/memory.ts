import type { CharacterState, MemoryRecord } from '../core/model'

export function createMemoryRecord(
  type: string,
  sourceEventId: string,
  character: Pick<CharacterState, 'age' | 'currentYear'>,
  tags: string[] = [],
  data?: Record<string, unknown>,
): MemoryRecord {
  const id = `mem-${type}-${character.currentYear}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    type,
    sourceEventId,
    age: character.age,
    year: character.currentYear,
    tags,
    data,
  }
}

export function addMemory(
  character: CharacterState,
  type: string,
  sourceEventId: string,
  tags: string[] = [],
  data?: Record<string, unknown>,
): CharacterState {
  const memory = createMemoryRecord(type, sourceEventId, character, tags, data)
  return {
    ...character,
    memories: [...character.memories, memory],
  }
}

export function hasMemory(character: CharacterState, typeOrTag: string): boolean {
  return character.memories.some((m) => m.type === typeOrTag || m.tags.includes(typeOrTag))
}

export function getMemories(character: CharacterState, typeOrTag?: string): MemoryRecord[] {
  if (!typeOrTag) return [...character.memories]
  return character.memories.filter((m) => m.type === typeOrTag || m.tags.includes(typeOrTag))
}
