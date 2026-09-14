import { formatTemplate, getNarrativeContent } from '../../content/activePack'
import { getLexicon } from '../../content/lexicon'
import { rewriteTimeline } from '../content/adapters'
import { creationWheelOptions, type WheelOption } from './creation'
import {
  confirmHeroOpportunity,
  contestWheelOptionsForRun,
  type ContestDetailOutcome,
  heroInteractionWheelOptions,
  heroOpportunityOptions,
  resolveHeroInteraction,
  yearAdvanceSummary,
  type HeroOpportunity,
} from './heroInteraction'
import { createSeededRng } from './rng'
import { normalizeLevel } from './progression'
import { applyTalentAcquisition, adjustWheelOptions } from './talents'
import {
  classifyRingYears,
  rollYearsWithinBin,
  ringWheelOptions,
  type RingBin,
} from './rings'
import {
  confirmBoneChoice,
  boneChoiceOptions,
} from './bones'
import {
  activityWheelOptions,
  chooseEvent,
  confirmEvent,
  closeLatestSchoolRecord,
  confirmSchool,
  confirmSchoolEventCount,
  confirmYear,
  schoolEventCountOptions,
} from './activities'
import {
  adultEventCountOptions,
  adultYearOptions,
  ascensionOfferOptions,
  confirmAdultEventCount,
  confirmAdultYear,
  confirmAscensionOffer,
  confirmContestRound,
  confirmEarlyContestOffer,
  continueAdultCycleEnd,
  continueAdultEndingCheck,
  confirmBeastCultivation,
  confirmBeastRace,
  earlyContestOfferOptions,
  finishLife,
  needsAscensionChoice,
  shouldEndAdultLife,
  beastCultivationOptions,
  startContest,
} from './lateGame'
import type {
  RewriteEventContent,
  RewriteSchoolContent,
} from '../content/adapters'
import type {
  Gender,
  RewriteCommand,
  RewriteRun,
  SpiritCategory,
  SpiritState,
} from './model'
import { isValidCharacterName } from './identity'

export type ReducerDependencies = {
  now(): string
  nextId(): string
  pickOption?: (options: readonly WheelOption[]) => WheelOption
}

function assertNever(value: never): never {
  throw new Error(`未处理的命令：${JSON.stringify(value)}`)
}

function heroEventFromPack(year: number): string {
  const lex = getLexicon()
  let current = `${lex.heroName}尚未出生，大陆维持着旧日秩序。`
  for (const entry of rewriteTimeline) {
    if (year < entry.year) break
    current = entry.event
  }
  return current
}

function weightedPick(
  options: readonly WheelOption[],
  next: () => number,
  talentId: string | null = null,
): WheelOption {
  const adjusted = adjustWheelOptions(options, talentId)
  if (adjusted.length === 0) {
    throw new Error('当前没有可用的转盘选项')
  }
  const total = adjusted.reduce((sum, option) => sum + Math.max(0, option.weight), 0)
  if (total <= 0) {
    throw new Error('当前没有可用的转盘选项')
  }
  let cursor = next() * total
  for (const option of adjusted) {
    cursor -= Math.max(0, option.weight)
    if (cursor < 0) return option
  }
  return adjusted.at(-1)!
}

function assertIdentity(run: RewriteRun) {
  if (
    run.flow.phase !== 'creation' ||
    run.flow.step !== 'identity' ||
    run.flow.status !== 'ready'
  ) throw new Error('当前不能确认身份')
}

function spiritIndex(step: string): number {
  return Number(step.match(/\d+/)?.[0] ?? 1) - 1
}

function nextAfterSpirit(run: RewriteRun, index: number): string {
  return index + 1 < run.character.spiritCount
    ? `spirit-${index + 2}-category`
    : 'innate-power'
}

function confirmCreation(run: RewriteRun): RewriteRun {
  if (run.pending?.kind !== 'wheel') throw new Error('没有待确认转盘结果')
  const step = run.flow.step
  const payload = run.pending.payload
  let character = run.character
  let creation = run.creation
  let nextStep = ''

  if (step === 'looks') {
    character = { ...character, looks: payload as number }
    nextStep = 'timeline'
  } else if (step === 'timeline') {
    const timeline = payload as { label: string; year: number }
    character = { ...character, birthYear: timeline.year, currentYear: timeline.year }
    nextStep = 'birth-place'
  } else if (step === 'birth-place') {
    character = { ...character, birthPlace: payload as string }
    nextStep = 'race'
  } else if (step === 'race') {
    const race = payload as { race: RewriteRun['character']['race']; raceName: string }
    character = { ...character, race: race.race, raceName: race.raceName }
    if (race.race === 'soul-beast') {
      return confirmBeastRace({ ...run, character })
    }
    nextStep = 'spirit-count'
  } else if (step === 'spirit-count') {
    character = {
      ...character,
      spiritCount: payload as 1 | 2 | 3 | 4,
    }
    nextStep = 'spirit-1-category'
  } else if (/^spirit-\d+-category$/.test(step)) {
    const index = spiritIndex(step)
    const categories = [...creation.spiritCategories]
    categories[index] = payload as SpiritCategory
    creation = { activeSpiritIndex: index, spiritCategories: categories }
    nextStep = `spirit-${index + 1}`
  } else if (/^spirit-\d+$/.test(step)) {
    const index = spiritIndex(step)
    const spirit = payload as SpiritState
    if (character.spirits.some((owned) => owned.id === spirit.id)) {
      throw new Error('不能重复获得同一命器')
    }
    character = { ...character, spirits: [...character.spirits, spirit] }
    creation = { ...creation, activeSpiritIndex: index + 1 }
    nextStep = nextAfterSpirit({ ...run, character }, index)
  } else if (step === 'innate-power') {
    const level = normalizeLevel(payload as number)
    character = { ...character, innatePower: level, level }
    nextStep = 'talent'
  } else if (step === 'talent') {
    character = applyTalentAcquisition(
      character,
      payload as string | null,
    )
    nextStep = 'creation-summary'
  } else {
    throw new Error('当前创建步骤不能确认结果')
  }

  return {
    ...run,
    character,
    creation,
    flow: { phase: 'creation', step: nextStep, status: 'ready' },
    pending: null,
  }
}

function isRingStep(step: string): boolean {
  return /^(?:soul-)?ring-[1-9]$/.test(step)
}

export function wheelOptionsForRun(run: RewriteRun): WheelOption[] {
  if (run.flow.phase === 'creation') return creationWheelOptions(run)
  if (isRingStep(run.flow.step)) return ringWheelOptions(run)
  if (
    run.flow.step === 'hero-interaction' ||
    run.flow.step === 'tang-san' ||
    run.flow.step === 'tang-san-conflict'
  ) {
    return heroInteractionWheelOptions(run)
  }
  if (run.flow.step === 'hero-opportunity') return heroOpportunityOptions()
  if (run.flow.step === 'bone-choice' || run.flow.step === 'soul-bone-choice') return boneChoiceOptions(run)
  if (run.flow.step === 'early-contest-offer') return earlyContestOfferOptions()
  if (run.flow.step === 'ascension-offer') return ascensionOfferOptions()
  if (run.flow.phase === 'contest') return contestWheelOptionsForRun(run)
  if (
    (
      run.flow.phase === 'primary-school' ||
      run.flow.phase === 'middle-school' ||
      run.flow.phase === 'high-school'
    ) &&
    run.flow.step === 'event-count'
  ) {
    return schoolEventCountOptions(run)
  }
  if (run.flow.phase === 'adult' && run.flow.step === 'event-count') {
    return adultEventCountOptions()
  }
  if (run.flow.phase === 'adult' && /^year-[1-5]$/.test(run.flow.step)) {
    return adultYearOptions()
  }
  if (
    run.flow.phase === 'soul-beast' &&
    run.flow.step === 'cultivation-year-1'
  ) return beastCultivationOptions()
  return activityWheelOptions(run)
}

function confirmRing(run: RewriteRun): RewriteRun {
  if (run.pending?.kind !== 'wheel') throw new Error('没有待确认灵环结果')
  const payload = run.pending.payload as {
    ringIndex: number
    years: number
    quality: ReturnType<typeof classifyRingYears>
  }
  const expectedIndex = run.character.rings.length + 1
  if (payload.ringIndex !== expectedIndex) throw new Error('灵环序号不连续')
  const previousYears = run.character.rings.at(-1)?.years ?? 0
  if (payload.years <= previousYears) throw new Error('新灵环年份必须高于上一枚')

  const frame = run.stack.at(-1)
  if (!frame) throw new Error('灵环活动缺少返回流程')
  return {
    ...run,
    character: {
      ...run.character,
      rings: [
        ...run.character.rings,
        {
          id: `ring-${payload.ringIndex}-${payload.years}`,
          index: payload.ringIndex,
          years: payload.years,
          quality: payload.quality,
          skillName: `第${payload.ringIndex}命技`,
          description: `${payload.years.toLocaleString()}年${payload.quality}灵环。`,
        },
      ],
    },
    flow: { phase: run.flow.phase, step: 'special-event', status: 'ready' },
    stack: run.stack,
    pending: null,
  }
}

export function reduceRewriteRun(
  run: RewriteRun,
  command: RewriteCommand,
  dependencies: ReducerDependencies,
): RewriteRun {
  if (command.type === 'CONFIRM_IDENTITY') {
    assertIdentity(run)
    const name = command.name.trim()
    if (!isValidCharacterName(name)) throw new Error('姓名仅支持一至四个汉字')
    const gender: Gender = command.gender
    return {
      ...run,
      updatedAt: dependencies.now(),
      character: { ...run.character, name, gender },
      flow: { phase: 'creation', step: 'looks', status: 'ready' },
    }
  }

  if (command.type === 'START_WHEEL') {
    if (run.flow.status !== 'ready') throw new Error('当前不能旋转')
    const options = wheelOptionsForRun(run)
    if (options.length === 0) throw new Error('当前没有可用的转盘选项')
    const rng = createSeededRng(run.seed, run.rngCursor)
    const option = dependencies.pickOption
      ? dependencies.pickOption(options)
      : weightedPick(options, () => rng.next(), run.character.talentId)
    if (dependencies.pickOption) rng.next()
    const ringPayload = isRingStep(run.flow.step)
      ? (() => {
          const bin = option.value as RingBin
          const years = rollYearsWithinBin(bin, rng)
          return {
            ringIndex: bin.ringIndex,
            years,
            quality: classifyRingYears(years),
          }
        })()
      : option.value
    const isYearStep = /^year-\d+$/.test(run.flow.step)
    const yearGrowth = isYearStep ? option.value as number : 0
    const effects = isYearStep
      ? [
          ...yearAdvanceSummary(run.character, yearGrowth),
          formatTemplate(getNarrativeContent().yearAdvance.heroLine, {
            calendar: getLexicon().calendarName,
            year: run.character.currentYear + 1,
            age: Math.max(0, run.character.currentYear + 1 - run.character.birthYear),
            growth: Math.round(yearGrowth * run.character.growthMultiplier),
            hero: getLexicon().heroName,
            heroEvent: heroEventFromPack(run.character.currentYear + 1),
          }),
        ]
      : []

    return {
      ...run,
      rngCursor: rng.cursor(),
      flow: { ...run.flow, status: 'animating' },
      pending: {
        kind: 'wheel',
        id: dependencies.nextId(),
        optionId: option.id,
        title: isRingStep(run.flow.step) && 'years' in (ringPayload as object)
          ? `${(ringPayload as { years: number }).years.toLocaleString()}年灵环`
          : option.name,
        description: isYearStep
          ? `这一年在大陆的呼吸里缓缓展开。`
          : option.description,
        effects,
        payload: ringPayload,
      },
    }
  }

  if (command.type === 'ANIMATION_FINISHED') {
    if (run.flow.status !== 'animating' || run.pending?.kind !== 'wheel') {
      throw new Error('当前没有正在播放的转盘结果')
    }
    return { ...run, flow: { ...run.flow, status: 'result-pending' } }
  }

  if (command.type === 'CONFIRM_RESULT') {
    if (run.flow.phase === 'creation') return confirmCreation(run)
    if (isRingStep(run.flow.step)) return confirmRing(run)
    if (run.flow.step === 'school-selection') {
      return confirmSchool(run, run.pending?.payload as RewriteSchoolContent)
    }
    if (run.flow.step === 'early-contest-offer') {
      return confirmEarlyContestOffer(run, run.pending?.payload as boolean)
    }
    if (run.flow.step === 'ascension-offer') {
      return confirmAscensionOffer(run, run.pending?.payload as boolean)
    }
    if (
      (
        run.flow.phase === 'primary-school' ||
        run.flow.phase === 'middle-school' ||
        run.flow.phase === 'high-school'
      ) &&
      /^year-\d+$/.test(run.flow.step)
    ) {
      return confirmYear(run, run.pending?.payload as number)
    }
    if (
      (
        run.flow.phase === 'primary-school' ||
        run.flow.phase === 'middle-school' ||
        run.flow.phase === 'high-school'
      ) &&
      run.flow.step === 'event-count'
    ) {
      return confirmSchoolEventCount(run, run.pending?.payload as number)
    }
    if (run.flow.step === 'special-event') {
      return confirmEvent(run, run.pending?.payload as RewriteEventContent)
    }
    if (
      run.flow.step === 'hero-interaction' ||
      run.flow.step === 'tang-san' ||
      run.flow.step === 'tang-san-conflict'
    ) {
      return resolveHeroInteraction(
        run,
        run.pending?.payload as 'win' | 'draw' | 'loss',
      )
    }
    if (run.flow.step === 'hero-opportunity') {
      return confirmHeroOpportunity(
        run,
        run.pending?.payload as HeroOpportunity,
      )
    }
    if (run.flow.step === 'bone-choice' || run.flow.step === 'soul-bone-choice') {
      return confirmBoneChoice(
        run,
        run.pending?.payload as 'keep' | 'replace',
      )
    }
    if (run.flow.phase === 'contest') {
      return confirmContestRound(
        run,
        run.pending?.payload as ContestDetailOutcome,
      )
    }
    if (run.flow.phase === 'adult' && run.flow.step === 'event-count') {
      return confirmAdultEventCount(run, run.pending?.payload as number)
    }
    if (run.flow.phase === 'adult' && /^year-[1-5]$/.test(run.flow.step)) {
      return confirmAdultYear(run, run.pending?.payload as number)
    }
    if (
      run.flow.phase === 'soul-beast' &&
      run.flow.step === 'cultivation-year-1'
    ) {
      return confirmBeastCultivation(run, run.pending?.payload as number)
    }
    throw new Error('当前结果类型尚未接入')
  }

  if (command.type === 'CHOOSE_EVENT') {
    return chooseEvent(run, command.choiceId)
  }

  if (command.type === 'CONTINUE') {
    if (run.flow.phase === 'creation' && run.flow.step === 'creation-summary') {
      return {
        ...run,
        flow: { phase: 'primary-school', step: 'school-selection', status: 'ready' },
      }
    }
    if (run.flow.step === 'stage-summary') {
      const closed = closeLatestSchoolRecord(run)
      if (closed.flow.phase === 'primary-school') {
        return {
          ...closed,
          flow: { phase: 'middle-school', step: 'school-selection', status: 'ready' },
        }
      }
      if (closed.flow.phase === 'middle-school') {
        return {
          ...closed,
          flow: { phase: 'high-school', step: 'school-selection', status: 'ready' },
        }
      }
      if (closed.flow.phase === 'high-school') return startContest(closed)
    }
    if (run.flow.phase === 'adult' && run.flow.step === 'adult-cycle-end') {
      return continueAdultCycleEnd(run)
    }
    if (run.flow.phase === 'adult' && run.flow.step === 'ending-check') {
      const progressed = continueAdultEndingCheck(run)
      if (!shouldEndAdultLife(progressed)) return progressed
      if (needsAscensionChoice(progressed)) {
        return {
          ...progressed,
          flow: { phase: 'adult', step: 'ascension-offer', status: 'ready' },
        }
      }
      return finishLife(progressed, dependencies.now(), dependencies.nextId())
    }
    throw new Error('当前不能继续')
  }

  return assertNever(command)
}
