import type { RewriteCommand, RewriteRun } from '../engine/model'
import { IdentityScreen } from '../ui/identity/IdentityScreen'
import { WheelScreen } from '../ui/screens/WheelScreen'
import { EventScreen } from '../ui/screens/EventScreen'
import { SummaryScreen } from '../ui/screens/SummaryScreen'
import { CreationSummaryScreen } from '../ui/screens/CreationSummaryScreen'
import { JourneyTransitionScreen } from '../ui/screens/JourneyTransitionScreen'

type RewriteRouterProps = {
  run: RewriteRun
  dispatch(command: RewriteCommand): void
  onRestart(): void
}

export function RewriteRouter({ run, dispatch, onRestart }: RewriteRouterProps) {
  if (run.flow.phase === 'creation' && run.flow.step === 'identity') {
    return (
      <IdentityScreen
        onConfirm={(name, gender) => dispatch({
          type: 'CONFIRM_IDENTITY',
          name,
          gender,
        })}
      />
    )
  }

  if (run.flow.phase === 'creation' && run.flow.step !== 'creation-summary') {
    return <WheelScreen run={run} dispatch={dispatch} />
  }

  if (run.flow.phase === 'creation' && run.flow.step === 'creation-summary') {
    return <CreationSummaryScreen run={run} dispatch={dispatch} />
  }

  if (run.flow.status === 'choice-pending') {
    return <EventScreen run={run} dispatch={dispatch} />
  }

  if (run.flow.phase === 'ending' && run.flow.step === 'summary') {
    return <SummaryScreen run={run} onRestart={onRestart} />
  }

  if (
    run.flow.step === 'school-selection' ||
    /^year-\d+$/.test(run.flow.step) ||
    /^(?:soul-)?ring-\d+$/.test(run.flow.step) ||
    run.flow.step === 'special-event' ||
    run.flow.step === 'event-count' ||
    run.flow.step === 'early-contest-offer' ||
    run.flow.step === 'ascension-offer' ||
    run.flow.step === 'bone-choice' ||
    run.flow.step === 'soul-bone-choice' ||
    run.flow.step === 'hero-interaction' ||
    run.flow.step === 'hero-opportunity' ||
    run.flow.step === 'tang-san' ||
    run.flow.step === 'tang-san-conflict' ||
    run.flow.phase === 'contest' ||
    (run.flow.phase === 'soul-beast' && run.flow.step === 'cultivation-year-1')
  ) {
    return <WheelScreen run={run} dispatch={dispatch} />
  }

  return <JourneyTransitionScreen run={run} dispatch={dispatch} />
}
