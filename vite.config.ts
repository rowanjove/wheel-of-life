import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const repoName = env?.GITHUB_REPOSITORY?.split('/')[1]
const isCI = env?.GITHUB_ACTIONS === 'true'

export default defineConfig({
  // GitHub Pages 自动适配仓库名（如 /WOL/）；本地开发使用根路径。
  base: isCI && repoName ? `/${repoName}/` : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
