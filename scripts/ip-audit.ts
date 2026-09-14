import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

export interface AuditResult {
  file: string
  line: number
  keyword: string
  lineContent: string
}

const ROOT = resolve(process.cwd())
const BLOCKLIST_PATH = join(ROOT, 'ip-blocklist.json')

const blocklist: string[] = JSON.parse(readFileSync(BLOCKLIST_PATH, 'utf-8'))

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.gstack',
  '.worktrees',
  'miniapp',
])

const IGNORED_FILES = new Set([
  'ip-blocklist.json',
  'scripts/ip-audit.ts',
  'scripts/neutralize-ip.mjs',
  'scripts/enrich-douluo-pack.mjs',
  'scripts/export-douluo-pack.mjs',
  'scripts/build-douluo-zip.mjs',
  'package-lock.json',
])

function scanDirectory(dir: string, baseDir: string, results: AuditResult[]): void {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const relPath = relative(ROOT, fullPath).replace(/\\/g, '/')

    if (IGNORED_DIRS.has(entry) || Array.from(IGNORED_DIRS).some(d => relPath.startsWith(d + '/'))) {
      continue
    }

    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      scanDirectory(fullPath, baseDir, results)
    } else if (stat.isFile()) {
      if (IGNORED_FILES.has(relPath)) continue

      // Only inspect text files
      if (!/\.(ts|tsx|js|jsx|mjs|cjs|json|md|html|css)$/.test(entry)) continue

      // Check if filename itself contains blocklist terms
      for (const kw of blocklist) {
        if (entry.toLowerCase().includes(kw.toLowerCase())) {
          results.push({
            file: relPath,
            line: 0,
            keyword: kw,
            lineContent: `[Filename contains blocked word: ${entry}]`,
          })
        }
      }

      try {
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split(/\r?\n/)
        lines.forEach((line, idx) => {
          for (const kw of blocklist) {
            const isAscii = /^[a-zA-Z0-9_-]+$/.test(kw)
            const matched = isAscii
              ? line.toLowerCase().includes(kw.toLowerCase())
              : line.includes(kw)

            if (matched) {
              results.push({
                file: relPath,
                line: idx + 1,
                keyword: kw,
                lineContent: line.trim(),
              })
            }
          }
        })
      } catch {
        // Skip unreadable files
      }
    }
  }
}

export function runAudit(targetDir = '.'): { totalHits: number; results: AuditResult[] } {
  const scanTarget = resolve(ROOT, targetDir)
  const results: AuditResult[] = []
  scanDirectory(scanTarget, scanTarget, results)
  return { totalHits: results.length, results }
}

// CLI execution
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename ?? '')) {
  const args = process.argv.slice(2)
  const isStrict = args.includes('--strict')
  const checkZeroTangSan = args.includes('--tangsan-zero')
  const targetIdx = args.indexOf('--target')
  const targetDir = targetIdx >= 0 && args[targetIdx + 1] ? args[targetIdx + 1] : '.'

  console.log(`[IP-Audit] Scanning target '${targetDir}' against ${blocklist.length} blocklist terms...`)
  const { totalHits, results } = runAudit(targetDir)

  const keywordCounts: Record<string, number> = {}
  for (const r of results) {
    keywordCounts[r.keyword] = (keywordCounts[r.keyword] || 0) + 1
  }

  console.log('\n[IP-Audit] Keyword Summary:')
  for (const [kw, count] of Object.entries(keywordCounts)) {
    console.log(`  - ${kw}: ${count} hits`)
  }

  console.log(`\n[IP-Audit] Total hits in '${targetDir}': ${totalHits}`)

  if (checkZeroTangSan) {
    const tangSanHits = results.filter(r => r.keyword.toLowerCase() === 'tangsan' || r.keyword === '唐三')
    if (tangSanHits.length > 0) {
      console.error(`\n[FAIL] Found ${tangSanHits.length} occurrences of TangSan in ${targetDir}:`)
      for (const h of tangSanHits) {
        console.error(`  ${h.file}:${h.line} -> ${h.lineContent}`)
      }
      process.exit(1)
    } else {
      console.log(`\n[PASS] 0 hits for TangSan / 唐三 in ${targetDir}!`)
    }
  }

  if (isStrict && totalHits > 0) {
    console.error(`\n[FAIL] IP Audit failed in strict mode with ${totalHits} hits in ${targetDir}.`)
    process.exit(1)
  }

  console.log('\n[IP-Audit] Audit completed successfully.')
}
