import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodexScreen } from './CodexScreen'

describe('CodexScreen Component', () => {
  it('renders correctly when open and allows tab switching', () => {
    let closed = false
    const handleClose = () => {
      closed = true
    }

    render(<CodexScreen isOpen={true} onClose={handleClose} initialWorldId="modern" />)

    expect(screen.getByText('人生图鉴与死法收集册 (Life Codex)')).toBeDefined()
    expect(screen.getByText('总轮回次数')).toBeDefined()
    expect(screen.getByText('当代人生')).toBeDefined()

    // Switch to Talents tab
    const talentsTab = screen.getByRole('tab', { name: /先天天赋/ })
    fireEvent.click(talentsTab)
    expect(talentsTab.className).toContain('active')

    // Switch to Deaths tab
    const deathsTab = screen.getByRole('tab', { name: /死法集册/ })
    fireEvent.click(deathsTab)
    expect(deathsTab.className).toContain('active')

    // Close button
    const closeBtn = screen.getByLabelText('关闭图鉴')
    fireEvent.click(closeBtn)
    expect(closed).toBe(true)
  })
})
