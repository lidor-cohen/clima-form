import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

const MONDAY_BOARD_ID = '5099980327'
const COLUMN_IDS = {
  phone: 'phone_mksacqgs',
  email: 'email_mksat2kd',
  address: 'text_mksarsaf',
}
const CACHE_TTL_MS = 60_000

type MondayClient = {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

/**
 * Serves GET /api/monday/clients in dev and preview so the Monday API key
 * stays server-side and is never bundled into the client build.
 */
function mondayClientsProxy(apiKey: string | undefined): Plugin {
  let cache: { at: number; data: MondayClient[] } | null = null

  const fetchClients = async (): Promise<MondayClient[]> => {
    if (!apiKey) throw new Error('MONDAY_API_KEY is not set in .env')
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data

    const clients: MondayClient[] = []
    let cursor: string | null = null
    do {
      const query = `query ($board: [ID!], $cursor: String) {
        boards(ids: $board) {
          items_page(limit: 100, cursor: $cursor) {
            cursor
            items { id name column_values { id text } }
          }
        }
      }`
      const res = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { board: [MONDAY_BOARD_ID], cursor } }),
      })
      if (!res.ok) throw new Error(`Monday API responded ${res.status}`)
      const json = (await res.json()) as any
      if (json.errors?.length) throw new Error(json.errors[0].message)
      const page = json.data.boards[0].items_page
      for (const item of page.items) {
        const col = (id: string) => item.column_values.find((c: any) => c.id === id)?.text ?? ''
        clients.push({
          id: item.id,
          name: item.name,
          phone: col(COLUMN_IDS.phone),
          email: col(COLUMN_IDS.email),
          address: col(COLUMN_IDS.address),
        })
      }
      cursor = page.cursor
    } while (cursor)

    cache = { at: Date.now(), data: clients }
    return clients
  }

  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/monday/clients')) return next()
    try {
      const data = await fetchClients()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ clients: data }))
    } catch (err) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown error' }))
    }
  }

  return {
    name: 'monday-clients-proxy',
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
    plugins: [react(), mondayClientsProxy(env.MONDAY_API_KEY)],
  }
})
