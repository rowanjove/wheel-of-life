import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { createRun } from '../../engine/factory'
import { StatusHeader } from './StatusHeader'

it('shows the formal character status and celestial crest', async () => {
  const user = userEvent.setup()
  const onRefresh = vi.fn()
  const base = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1').character
  const character = {
    ...base,
    name: '林云深',
    race: 'human' as const,
    raceName: '人族',
    birthYear: 2630,
    currentYear: 2642,
    level: 36,
  }

  render(<StatusHeader character={character} onRefresh={onRefresh} />)

  expect(screen.getByRole('img', { name: '角色头像' })).toBeVisible()
  expect(screen.getByRole('img', { name: '命运纹章' })).toBeVisible()
  expect(screen.getByText('林云深 · 12岁')).toBeVisible()
  expect(screen.getByText(/36级 · 灵尊/)).toHaveClass('rewrite-level-badge')
  expect(screen.getByText('灵元历 2642年')).toBeVisible()
  await user.click(screen.getByRole('button', { name: '展开角色详情' }))
  expect(screen.getByText('尚未获得灵环')).toBeVisible()
  expect(screen.getByText('先天灵力')).toBeVisible()

  await user.click(screen.getByRole('button', { name: '收起角色详情' }))
  expect(screen.queryByText('尚未获得灵环')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: '刷新游戏' }))
  expect(onRefresh).toHaveBeenCalledOnce()
})

it('lists acquired rings in the expanded panel', async () => {
  const user = userEvent.setup()
  const base = createRun(42, '2026-06-20T00:00:00.000Z', 'run-1').character
  const character = {
    ...base,
    name: '林云深',
    race: 'human' as const,
    raceName: '人族',
    rings: [{
      id: 'ring-1-1000',
      index: 1,
      years: 1000,
      quality: 'purple' as const,
      skillName: '第一命技',
      description: '测试',
    }],
  }

  render(<StatusHeader character={character} onRefresh={() => {}} />)
  await user.click(screen.getByRole('button', { name: '展开角色详情' }))

  expect(screen.getByText('1,000年 紫色')).toBeVisible()
})
