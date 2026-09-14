import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import type { WheelOption } from '../../engine/creation'
import { DestinyWheel } from './DestinyWheel'

const options: WheelOption[] = [
  { id: 'a', name: '帝都', description: '帝国资源与权力汇聚。', weight: 60, color: '#3D7DD6', value: 'a' },
  { id: 'b', name: '极北之地', description: '冰雪磨砺出坚韧灵魂。', weight: 40, color: '#E07A9A', value: 'b' },
]

const denseOptions: WheelOption[] = Array.from({ length: 17 }, (_, index) => ({
  id: `dense-${index}`,
  name: `黑色 ${index + 1}0000–${index + 1}9999年`,
  description: '高密度测试选项',
  weight: 1,
  color: '#273044',
  value: index,
}))

it('renders clean wheel chrome and opens details from option list', async () => {
  const user = userEvent.setup()
  const onSpin = vi.fn()
  render(<DestinyWheel options={options} status="ready" onSpin={onSpin} />)

  expect(screen.getByTestId('destiny-wheel')).toBeVisible()
  expect(screen.getByTestId('wheel-outer-frame')).toBeVisible()
  expect(screen.getByTestId('wheel-gem-center')).toBeVisible()
  expect(screen.getByTestId('wheel-pointer')).toBeVisible()
  expect(screen.getByTestId('wheel-rotor')).toBeVisible()

  await user.click(screen.getByRole('button', { name: '开始旋转' }))
  expect(onSpin).toHaveBeenCalledOnce()

  await user.click(screen.getByRole('button', { name: /查看全部选项/ }))
  await user.click(screen.getByRole('button', { name: '查看 帝都 详情' }))
  expect(screen.getByRole('dialog', { name: '扇区详情' })).toBeVisible()
})

it('disables spinning while animating', () => {
  render(
    <DestinyWheel
      options={options}
      status="animating"
      onSpin={vi.fn()}
      targetOptionId="a"
    />,
  )

  expect(screen.getByRole('button', { name: '正在旋转' })).toBeDisabled()
})

it('switches dense wheels to an explicit readable-details hint', () => {
  render(<DestinyWheel options={denseOptions} status="ready" onSpin={vi.fn()} />)

  expect(screen.getByTestId('destiny-wheel')).toHaveClass('destiny-wheel--dense')
  expect(screen.getByTestId('wheel-density-note')).toHaveTextContent('展开下方选项')
})

it('destinyWheelEasing generates smooth monotonic acceleration and damped deceleration', async () => {
  const { destinyWheelEasing } = await import('./DestinyWheel')
  expect(destinyWheelEasing(0)).toBe(0)
  expect(destinyWheelEasing(1)).toBe(1)

  // 验证单调递增性
  let prev = -1
  for (let i = 0; i <= 100; i++) {
    const val = destinyWheelEasing(i / 100)
    expect(val).toBeGreaterThanOrEqual(prev)
    prev = val
  }

  // 验证起步二次加速（t=0.06 时位移较小，代表蓄力）
  expect(destinyWheelEasing(0.06)).toBeLessThan(0.05)
  // 验证终点前已大部分转完，阻尼平稳咬合（t=0.8 时位移已过 0.85）
  expect(destinyWheelEasing(0.8)).toBeGreaterThan(0.85)
})

it('formatSliceLabel never blanks out dense wheel options', async () => {
  const { formatSliceLabel } = await import('./DestinyWheel')
  expect(formatSliceLabel('黑色 10000–19999年', 17)).toBe('1~2万')
  expect(formatSliceLabel('凌霄剑', 17)).toBe('凌霄剑')
  expect(formatSliceLabel('九宝琉璃塔', 17)).toBe('九宝…')
  expect(formatSliceLabel('帝都', 4)).toBe('帝都')
  expect(formatSliceLabel('冰封极北苦寒境', 8)).toBe('冰封极北…')
})
