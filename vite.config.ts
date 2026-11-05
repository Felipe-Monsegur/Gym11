import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function buildIdPlugin(): Plugin {
  return {
    name: 'app-build-id',
    config() {
      return {
        define: {
          __BUILD_ID__: JSON.stringify(buildId),
        },
      }
    },
    transformIndexHtml(html) {
      return html.replaceAll('%BUILD_ID%', buildId)
    },
    closeBundle() {
      writeFileSync(
        resolve(rootDir, 'dist/version.json'),
        JSON.stringify({ buildId }),
        'utf-8',
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), buildIdPlugin()],
})
