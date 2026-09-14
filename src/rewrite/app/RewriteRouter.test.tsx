import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { createRun } from '../engine/factory'
import { RewriteRouter } from './RewriteRouter'

it('routes a fresh run directly to identity', () => {
  render(
    <RewriteRouter
      run={createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')}
      dispatch={vi.fn()}
      onRestart={vi.fn()}
    />,
  )

  expect(screen.getByRole('heading', { name: '在石碑上刻下你的名字' })).toBeVisible()
})

it('renders the ending summary route', () => {
  const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
  run.character.name = '林云深'
  run.character.endingId = 'ordinary-life'
  run.flow = { phase: 'ending', step: 'summary', status: 'completed' }

  render(<RewriteRouter run={run} dispatch={vi.fn()} onRestart={vi.fn()} />)

  expect(screen.getByText('人生终章')).toBeVisible()
  expect(screen.getByRole('button', { name: '开始新人生' })).toBeVisible()
})

it('routes creation-summary to a formal character summary', () => {
  const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
  run.character.name = '白清歌'
  run.flow = { phase: 'creation', step: 'creation-summary', status: 'ready' }

  render(<RewriteRouter run={run} dispatch={vi.fn()} onRestart={vi.fn()} />)

  expect(screen.getByRole('heading', { name: '命运初定' })).toBeVisible()
  expect(screen.queryByText('creation / creation-summary')).not.toBeInTheDocument()
})

it('never exposes internal flow identifiers on transition routes', () => {
  const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
  run.flow = { phase: 'primary-school', step: 'stage-summary', status: 'ready' }

  render(<RewriteRouter run={run} dispatch={vi.fn()} onRestart={vi.fn()} />)

  expect(screen.getByRole('heading', { name: '阶段小结' })).toBeVisible()
  expect(screen.queryByText(/primary-school|stage-summary|\//)).not.toBeInTheDocument()
})

it('routes bone-choice step to the destiny wheel screen', () => {
  const run = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1')
  run.flow = { phase: 'adult', step: 'bone-choice', status: 'ready' }

  render(<RewriteRouter run={run} dispatch={vi.fn()} onRestart={vi.fn()} />)

  expect(screen.getByTestId('destiny-wheel')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /抉择/ })).toBeVisible()
})
