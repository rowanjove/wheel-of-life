import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLifeStore } from '../store/lifeStore'
import { WOLApp } from './WOLApp'

describe('ProbabilityInspector & Inventory Active Use', () => {
  beforeEach(() => {
    useLifeStore.getState().startCreation('modern')
    useLifeStore.getState().confirmCreationAndStart()
  })

  it('opens and closes Probability Inspector modal from MainGameScreen', () => {
    render(<WOLApp />)

    const inspectorBtn = screen.getByLabelText('打开概率透视器')
    expect(inspectorBtn).toBeDefined()

    // Open Inspector
    fireEvent.click(inspectorBtn)

    expect(screen.getByText('概率透视器 (Probability Inspector)')).toBeDefined()
    expect(screen.getByText(/机缘保底机制/)).toBeDefined()
    expect(screen.getByText(/高危防暴毙保护/)).toBeDefined()
    expect(screen.getByText(/全部候选/)).toBeDefined()

    // Close Inspector
    const closeBtn = screen.getByLabelText('关闭概率透视器')
    fireEvent.click(closeBtn)

    expect(screen.queryByText('概率透视器 (Probability Inspector)')).toBeNull()
  })

  it('allows active use of inventory consumable items', () => {
    // Add a test consumable item to character before render
    const session = useLifeStore.getState().session
    if (session) {
      useLifeStore.setState({
        session: {
          ...session,
          character: {
            ...session.character,
            inventory: [
              { id: 'item-first-aid', name: '应急医疗包', type: 'consumable', quantity: 2 },
            ],
          },
        },
      })
    }

    render(<WOLApp />)

    // Switch to inventory tab
    const invTab = screen.getByRole('tab', { name: /随身|行囊|背包/ })
    fireEvent.click(invTab)

    const useBtn = screen.getByText('使用')
    expect(useBtn).toBeDefined()

    fireEvent.click(useBtn)

    // Quantity should have decreased from 2 to 1
    const updatedChar = useLifeStore.getState().session?.character
    expect(updatedChar?.inventory[0].quantity).toBe(1)
    expect(updatedChar?.history.some((h) => h.title.includes('应急医疗包'))).toBe(true)
  })
})
