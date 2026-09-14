import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runSimulationSuite } from '../src/engine/simulator/metrics'
import { analyzeBalance, generateMarkdownReport } from '../src/engine/simulator/balanceAnalyzer'
import type { PlayerPolicy } from '../src/engine/simulator/autoPlayer'

function parseArgs(): { runs: number; policy: PlayerPolicy; world: string } {
  const args = process.argv.slice(2)
  let runs = 1000
  let policy: PlayerPolicy = 'balanced'
  let world = 'modern'

  const runsIdx = args.indexOf('--runs')
  if (runsIdx >= 0 && args[runsIdx + 1]) {
    runs = Number.parseInt(args[runsIdx + 1], 10) || 1000
  }

  const polIdx = args.indexOf('--policy')
  if (polIdx >= 0 && args[polIdx + 1]) {
    policy = args[polIdx + 1] as PlayerPolicy
  }

  const worldIdx = args.indexOf('--world')
  if (worldIdx >= 0 && args[worldIdx + 1]) {
    world = args[worldIdx + 1]
  }

  return { runs, policy, world }
}

const { runs, policy, world } = parseArgs()

console.log(`[Simulator] Starting headless simulation for ${runs} lives (world: ${world}, policy: ${policy})...`)
const metrics = runSimulationSuite(runs, policy, world)
const warnings = analyzeBalance(metrics)
const markdown = generateMarkdownReport(metrics, warnings)

const reportJsonPath = join(process.cwd(), 'simulation-report.json')
const reportMdPath = join(process.cwd(), 'simulation-report.md')

writeFileSync(reportJsonPath, JSON.stringify(metrics, null, 2), 'utf-8')
writeFileSync(reportMdPath, markdown, 'utf-8')

console.log(`[Simulator] Simulation completed in ${metrics.durationMs}ms!`)
console.log(`  - Average Lifespan: ${metrics.lifespans.average} (Median: ${metrics.lifespans.median})`)
console.log(`  - Average Decisions: ${metrics.averageDecisions} / life`)
console.log(`  - Average Fate Wheels: ${metrics.averageWheels} / life`)
console.log(`  - Warnings: ${warnings.length}`)
if (warnings.length > 0) {
  for (const w of warnings) {
    console.log(`    [${w.code}] ${w.message}`)
  }
}
console.log(`[Simulator] Reports written to:`)
console.log(`  - ${reportJsonPath}`)
console.log(`  - ${reportMdPath}`)
