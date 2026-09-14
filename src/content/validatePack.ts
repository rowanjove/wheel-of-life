import type { ContentPack } from './packTypes'

const FACTIONS = new Set(['sanctuary', 'empire', 'beasts', 'reputation'])
const SPIRIT_CATEGORIES = new Set(['tool', 'beast', 'nature', 'body', 'special'])
const RACES = new Set(['human', 'half-beast', 'soul-beast', 'divine', 'ghost'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertUniqueIds(items: ReadonlyArray<{ id: string }>, label: string): void {
  const ids = items.map((item) => item.id)
  assert(ids.every((id) => typeof id === 'string' && id.length > 0), `${label}含空 id`)
  assert(new Set(ids).size === ids.length, `${label}存在重复 id`)
}

function validateEffect(effect: unknown, path: string): void {
  assert(isRecord(effect) && typeof effect.type === 'string', `${path}: effect 无效`)
  switch (effect.type) {
    case 'level':
    case 'max-level':
    case 'growth-multiplier':
      assert(typeof effect.amount === 'number' && Number.isFinite(effect.amount), `${path}: amount`)
      assert(Math.abs(effect.amount as number) < 1e6, `${path}: amount 过大`)
      break
    case 'title':
    case 'flag':
    case 'item':
    case 'knowledge':
      assert(typeof effect.id === 'string', `${path}: id`)
      break
    case 'partner':
      assert(typeof effect.name === 'string', `${path}: partner name`)
      break
    case 'relationship':
      assert(typeof effect.faction === 'string' && FACTIONS.has(effect.faction), `${path}: faction`)
      assert(typeof effect.amount === 'number' && Number.isFinite(effect.amount), `${path}: amount`)
      break
    case 'hero-unlock':
      break
    case 'queue-activity':
      // Reserved — engine currently no-ops; still require an activity object shape
      assert(isRecord(effect.activity), `${path}: activity`)
      break
    case 'composite':
      assert(Array.isArray(effect.effects), `${path}: composite effects`)
      for (const [index, child] of (effect.effects as unknown[]).entries()) {
        validateEffect(child, `${path}.effects[${index}]`)
      }
      break
    default:
      throw new Error(`${path}: 未知 effect 类型 ${String(effect.type)}`)
  }
}

/** Deep structural validation for installed content packs. */
export function validateContentPack(value: unknown): ContentPack {
  assert(isRecord(value), '扩展包不是对象')
  assert(typeof value.id === 'string' && value.id.length > 0, '扩展包缺少 id')
  assert(typeof value.name === 'string' && value.name.length > 0, '扩展包缺少 name')
  assert(typeof value.version === 'string', '扩展包缺少 version')
  assert(Array.isArray(value.spirits), '缺少 spirits')
  assert(Array.isArray(value.talents), '缺少 talents')
  assert(Array.isArray(value.endings), '缺少 endings')
  assert(Array.isArray(value.events), '缺少 events')
  assert(Array.isArray(value.timeline), '缺少 timeline')
  assert(isRecord(value.schools), '缺少 schools')
  assert(Array.isArray(value.schools.primary), '缺少 schools.primary')
  assert(Array.isArray(value.schools.middle), '缺少 schools.middle')
  assert(Array.isArray(value.schools.high), '缺少 schools.high')

  const pack = value as unknown as ContentPack

  assert(pack.spirits.length > 0 && pack.spirits.length <= 500, 'spirits 数量异常')
  assert(pack.events.length > 0 && pack.events.length <= 2000, 'events 数量异常')
  assert(pack.timeline.length <= 200, 'timeline 过长')

  for (const [index, spirit] of pack.spirits.entries()) {
    assert(typeof spirit.id === 'string', `spirits[${index}].id`)
    assert(typeof spirit.name === 'string', `spirits[${index}].name`)
    assert(SPIRIT_CATEGORIES.has(spirit.category), `spirits[${index}].category`)
    assert(typeof spirit.weight === 'number' && spirit.weight >= 0, `spirits[${index}].weight`)
  }
  assertUniqueIds(pack.spirits, 'spirits')

  for (const [index, talent] of pack.talents.entries()) {
    assert(typeof talent.id === 'string' && typeof talent.name === 'string', `talents[${index}]`)
  }
  assertUniqueIds(pack.talents, 'talents')

  for (const [index, ending] of pack.endings.entries()) {
    assert(typeof ending.id === 'string' && typeof ending.name === 'string', `endings[${index}]`)
  }
  assertUniqueIds(pack.endings, 'endings')

  const schools = [
    ...pack.schools.primary,
    ...pack.schools.middle,
    ...pack.schools.high,
  ]
  for (const [index, school] of schools.entries()) {
    assert(typeof school.id === 'string' && typeof school.name === 'string', `schools[${index}]`)
  }
  assertUniqueIds(schools, 'schools')

  for (const [index, event] of pack.events.entries()) {
    assert(typeof event.id === 'string', `events[${index}].id`)
    assert(typeof event.name === 'string', `events[${index}].name`)
    assert(typeof event.weight === 'number' && event.weight >= 0, `events[${index}].weight`)
    assert(Array.isArray(event.effects), `events[${index}].effects`)
    assert(Array.isArray(event.choices), `events[${index}].choices`)
    for (const [ei, effect] of event.effects.entries()) {
      validateEffect(effect, `events[${index}].effects[${ei}]`)
    }
    for (const [ci, choice] of event.choices.entries()) {
      assert(typeof choice.id === 'string', `events[${index}].choices[${ci}].id`)
      assert(Array.isArray(choice.effects), `events[${index}].choices[${ci}].effects`)
      for (const [ei, effect] of choice.effects.entries()) {
        validateEffect(effect, `events[${index}].choices[${ci}].effects[${ei}]`)
      }
    }
  }
  assertUniqueIds(pack.events, 'events')

  if (pack.creation) {
    assert(Array.isArray(pack.creation.timelines), 'creation.timelines')
    assert(Array.isArray(pack.creation.birthPlaces), 'creation.birthPlaces')
    assert(Array.isArray(pack.creation.races), 'creation.races')
    for (const race of pack.creation.races) {
      assert(RACES.has(race.race), `creation.race ${race.id}`)
    }
  }

  return pack
}
