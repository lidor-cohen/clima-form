import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error plain JS module shared with the production server (server/index.mjs)
import { createApiMiddleware } from './server/monday.mjs'

/**
 * Serves /api/* in dev and preview so the Monday API key and webhook URL
 * stay server-side and are never bundled into the client build.
 */
function apiPlugin(env: Record<string, string>): Plugin {
  const middleware = createApiMiddleware(env)
  return {
    name: 'clima-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiPlugin(env)],
  }
})
