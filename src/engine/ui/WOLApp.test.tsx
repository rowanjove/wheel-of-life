import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLifeStore } from '../store/lifeStore'
import { WOLApp } from './WOLApp'

describe('WOL 2.0 - Universal UI Flow', () => {
  beforeEach(() => {
    useLifeStore.getState().startCreation('wuxia')
  })

  it('renders CreationScreen defaulting to Ancient world (Wuxia) with themed lexicon', () => {
    render(<WOLApp />)

    // 默认古代江湖定制文案
    expect(screen.getByText(/投 胎 问 卦/)).toBeDefined()
    expect(screen.getByText('江湖风云')).toBeDefined()
    expect(screen.getByText('修仙求道')).toBeDefined()
    expect(screen.getByText('当代人生')).toBeDefined()
    expect(screen.getByDisplayValue('沈炼')).toBeDefined()
    expect(screen.getByText('策 马 踏 入 江 湖')).toBeDefined()
  })

  it('switches between Ancient, Xianxia, and Modern worlds and updates lexicon accordingly', () => {
    render(<WOLApp />)

    // 切换至修仙世界
    const xianxiaTab = screen.getByText('修仙求道')
    fireEvent.click(xianxiaTab)

    expect(useLifeStore.getState().creation.selectedWorldId).toBe('xianxia')
    expect(screen.getByDisplayValue('叶清歌')).toBeDefined()
    expect(screen.getByText(/宿 命 转 生/)).toBeDefined()
    expect(screen.getByText('逆 天 踏 上 仙 途')).toBeDefined()

    // 切换至现代世界
    const modernTab = screen.getByText('当代人生')
    fireEvent.click(modernTab)

    expect(useLifeStore.getState().creation.selectedWorldId).toBe('modern')
    expect(screen.getByDisplayValue('张明')).toBeDefined()
    expect(screen.getByText(/降 生 规 划/)).toBeDefined()
    expect(screen.getByText('踏 入 当 代 人 生')).toBeDefined()
  })

  it('allows point allocation and transitions into the themed Wheel main game screen', () => {
    render(<WOLApp />)

    // 点击平均分配
    const avgBtn = screen.getByText('平均分配')
    fireEvent.click(avgBtn)

    // 开始古代江湖人生
    const startBtn = screen.getByText('策 马 踏 入 江 湖')
    fireEvent.click(startBtn)

    expect(useLifeStore.getState().phase).toBe('wheel')
    expect(screen.getByText('拨动江湖风云之轮')).toBeDefined()
    expect(screen.getByText('沈炼')).toBeDefined()
    expect(screen.getByText('身手筋骨')).toBeDefined()
    expect(screen.getByText(/江湖行囊/)).toBeDefined()
  })

  it('handles fate wheel spin trigger', () => {
    render(<WOLApp />)

    // 开始人生
    fireEvent.click(screen.getByText('策 马 踏 入 江 湖'))

    const spinBtn = screen.getByLabelText('开始旋转')
    fireEvent.click(spinBtn)

    expect(useLifeStore.getState().isSpinning).toBe(true)
  })

  it('supports toggling between standard mode and fast mode to reduce fatigue', () => {
    render(<WOLApp />)

    // 默认标准模式
    expect(useLifeStore.getState().playMode).toBe('standard')

    // 创角界面切换为极速模式
    const fastModeBtn = screen.getByLabelText('选择极速轮回模式')
    fireEvent.click(fastModeBtn)
    expect(useLifeStore.getState().playMode).toBe('fast')

    // 开始游戏
    fireEvent.click(screen.getByText('策 马 踏 入 江 湖'))

    // 在主界面看到模式按钮为激活态并可来回切换
    const toggleBtn = screen.getByLabelText('切换为沉浸轮盘模式')
    expect(toggleBtn).toBeDefined()
    fireEvent.click(toggleBtn)
    expect(useLifeStore.getState().playMode).toBe('standard')

    // 测试音效静音切换
    const soundBtn = screen.getByLabelText('静音')
    fireEvent.click(soundBtn)
    expect(useLifeStore.getState().soundMuted).toBe(true)
  })
})
