import { describe, it, expect, beforeEach, vi } from 'vitest'
import { soundManager } from './soundManager'

describe('soundManager', () => {
  beforeEach(() => {
    soundManager.setMuted(false)
  })

  it('toggles mute status correctly and remembers setting', () => {
    expect(soundManager.isMuted()).toBe(false)
    const newStatus = soundManager.toggleMute()
    expect(newStatus).toBe(true)
    expect(soundManager.isMuted()).toBe(true)
    soundManager.toggleMute()
    expect(soundManager.isMuted()).toBe(false)
  })

  it('safely handles playback methods in headless environment without crashing', () => {
    expect(() => {
      soundManager.playTick()
      soundManager.startWheelSpin(100)
      soundManager.stopWheelSpin()
      soundManager.playOpportunity()
      soundManager.playCrisis()
      soundManager.playClick()
    }).not.toThrow()
  })
})
