import type { SimulationMetrics } from './metrics'

export interface BalanceWarning {
  level: 'info' | 'warning' | 'error'
  code: string
  message: string
}

export function analyzeBalance(metrics: SimulationMetrics): BalanceWarning[] {
  const warnings: BalanceWarning[] = []

  // 1. Ending overrepresentation
  for (const [endingId, data] of Object.entries(metrics.endingDistribution)) {
    if (data.percentage > 55) {
      warnings.push({
        level: 'warning',
        code: 'ENDING_OVERREPRESENTED',
        message: `结局【${endingId}】占比过高 (${data.percentage}%)，建议补充其他分支或调整个别成就门槛。`,
      })
    }
  }

  // 2. Lifespan check
  if (metrics.lifespans.median < 50) {
    warnings.push({
      level: 'warning',
      code: 'MEDIAN_LIFESPAN_TOO_LOW',
      message: `寿命中位数过低 (${metrics.lifespans.median} 岁)，早夭率可能偏高。`,
    })
  }

  // 3. Pacing check (Section 13: 25~40 decisions)
  if (metrics.averageDecisions < 15) {
    warnings.push({
      level: 'warning',
      code: 'DECISIONS_TOO_FEW',
      message: `平均每局有效决策过少 (${metrics.averageDecisions} 次)，人生信息量偏薄。`,
    })
  } else if (metrics.averageDecisions > 55) {
    warnings.push({
      level: 'info',
      code: 'DECISIONS_SLIGHTLY_HIGH',
      message: `平均每局决策偏多 (${metrics.averageDecisions} 次)，单局时长可能超过预期。`,
    })
  }

  // 4. Fate Wheel frequency (Section 11: 4~7 major wheels)
  if (metrics.averageWheels > 8) {
    warnings.push({
      level: 'warning',
      code: 'WHEEL_FATIGUE',
      message: `命运转盘出现频率过高 (${metrics.averageWheels} 次)，可能造成点击疲倦。`,
    })
  }

  return warnings
}

export function generateMarkdownReport(
  metrics: SimulationMetrics,
  warnings: BalanceWarning[],
): string {
  let md = `# WOL 2.0 人生模拟器平衡性审查报告\n\n`
  md += `> 模拟局数：**${metrics.totalRuns}** 局 | 决策策略：**${metrics.policy}** | 耗时：**${metrics.durationMs}ms**\n\n`

  md += `## 1. 核心人生节奏指标\n\n`
  md += `| 指标 | 实际数值 | 规划基线建议 |\n`
  md += `|---|---|---|\n`
  md += `| 平均寿命 | **${metrics.lifespans.average}** 岁 | 65~80 岁 |\n`
  md += `| 寿命中位数 | **${metrics.lifespans.median}** 岁 | 70~80 岁 |\n`
  md += `| 寿命极值 [Min, Max] | [${metrics.lifespans.min}, ${metrics.lifespans.max}] 岁 | [0~25, 85~95] 岁 |\n`
  md += `| 单局平均有效决策 | **${metrics.averageDecisions}** 次 | 25~40 次 |\n`
  md += `| 单局重大命运轮盘 | **${metrics.averageWheels}** 次 | 2~5 次 |\n\n`

  md += `## 2. 出身背景 (Origin) 分布\n\n`
  md += `| 出身 | 频次 | 占比 |\n`
  md += `|---|---|---|\n`
  for (const [id, data] of Object.entries(metrics.originDistribution)) {
    md += `| \`${id}\` | ${data.count} | ${data.percentage}% |\n`
  }
  md += `\n`

  md += `## 3. 结局 (Ending) 分布\n\n`
  md += `| 结局类型 | 达成局数 | 占比 |\n`
  md += `|---|---|---|\n`
  for (const [id, data] of Object.entries(metrics.endingDistribution)) {
    md += `| \`${id}\` | ${data.count} | ${data.percentage}% |\n`
  }
  md += `\n`

  md += `## 4. 平衡性诊断与告警\n\n`
  if (warnings.length === 0) {
    md += `✅ **所有平衡性健康指标均处于设计基线范围内！**\n`
  } else {
    for (const w of warnings) {
      const icon = w.level === 'error' ? '❌' : w.level === 'warning' ? '⚠️' : 'ℹ️'
      md += `- ${icon} **[${w.code}]** ${w.message}\n`
    }
  }

  return md
}
