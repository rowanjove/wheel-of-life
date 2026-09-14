export interface WheelSector {
  id: string
  title: string
  category?: string
  weight: number
  probability: number // 归一化后的概率 [0, 1]
  percentage: string // 如 "25.4%"
  color?: string
}

export interface WheelSnapshot {
  id: string
  createdAt: number
  mode: 'single' | 'category'
  sectors: WheelSector[]
  totalWeight: number
  selectedSectorId: string
  selectedSector: WheelSector
  rngValue: number
}
