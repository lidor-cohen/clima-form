const MONDAY_BOARD_ID = '5099980327'
const COLUMN_IDS = {
  phone: 'phone_mksacqgs',
  email: 'email_mksat2kd',
  address: 'text_mksarsaf',
}
const CACHE_TTL_MS = 60_000

let cache = null

export async function fetchMondayClients(apiKey) {
  if (!apiKey) throw new Error('MONDAY_API_KEY is not set')
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data

  const clients = []
  let cursor = null
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
    const json = await res.json()
    if (json.errors?.length) throw new Error(json.errors[0].message)
    const page = json.data.boards[0].items_page
    for (const item of page.items) {
      const col = (id) => item.column_values.find((c) => c.id === id)?.text ?? ''
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

/** Shared /api/* handler for both the Vite dev server and the production server. */
export function createApiMiddleware(env) {
  return async (req, res, next) => {
    const url = req.url ?? ''
    const json = (status, body) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(body))
    }
    if (url.startsWith('/api/monday/clients')) {
      try {
        json(200, { clients: await fetchMondayClients(env.MONDAY_API_KEY) })
      } catch (err) {
        json(502, { error: err instanceof Error ? err.message : 'unknown error' })
      }
      return
    }
    if (url.startsWith('/api/config')) {
      json(200, { webhookUrl: env.VITE_WEBHOOK_URL || env.WEBHOOK_URL || null })
      return
    }
    next()
  }
}
