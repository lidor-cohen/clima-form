import { allocateOrderNumber } from './orders.mjs'

/**
 * Contact sources for the שם הלקוח picker. Both boards are searched: an order
 * is often written for a lead that was never converted to a customer, so
 * restricting this to the customers board hid ~98% of the address book.
 */
const BOARDS = [
  {
    id: '5099980327',
    name: 'לקוחות',
    source: 'customer',
    columns: {
      phone: 'phone_mksacqgs',
      email: 'email_mksat2kd',
      address: 'text_mksarsaf',
      city: 'text_mm63278f',
    },
  },
  {
    id: '5099980319',
    name: 'לידים',
    source: 'lead',
    columns: {
      phone: 'phone_mknyz5h',
      email: 'email_mknynbcr',
      // כתובת מלאה — street/house/floor/apartment, city lives in its own column
      address: 'text_mknykx0e',
      city: 'text_mkpsxy3j',
      status: 'status',
    },
  },
]

const CACHE_TTL_MS = 5 * 60_000
/** Upstream submit retry: 5xx and network faults only, never 4xx. */
const SUBMIT_ATTEMPTS = 3
const SUBMIT_BACKOFF_MS = [500, 1500]
const SUBMIT_TIMEOUT_MS = 20_000

let cache = null
let inFlight = null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Digits only, Israeli 972-prefix folded to a leading 0, so "972544558962" → "0544558962". */
export function phoneDigits(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('972') ? '0' + digits.slice(3) : digits
}

async function fetchBoard(board, apiKey) {
  const contacts = []
  const columnIds = Object.values(board.columns).filter(Boolean)
  let cursor = null
  do {
    // 500 rows a page and only the columns we read — the leads board is ~1,900
    // items with 25 columns, and fetching all of them took ~20s
    const query = `query ($board: [ID!], $cursor: String, $cols: [String!]) {
      boards(ids: $board) {
        items_page(limit: 500, cursor: $cursor) {
          cursor
          items { id name column_values(ids: $cols) { id text } }
        }
      }
    }`
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { board: [board.id], cursor, cols: columnIds } }),
    })
    if (!res.ok) throw new Error(`Monday API responded ${res.status} for board ${board.id}`)
    const json = await res.json()
    if (json.errors?.length) throw new Error(json.errors[0].message)
    const page = json.data.boards[0]?.items_page
    if (!page) break
    for (const item of page.items) {
      const col = (id) => (id ? item.column_values.find((c) => c.id === id)?.text ?? '' : '')
      const phone = col(board.columns.phone)
      contacts.push({
        id: item.id,
        boardId: board.id,
        source: board.source,
        name: item.name,
        phone,
        phoneDigits: phoneDigits(phone),
        email: col(board.columns.email),
        address: col(board.columns.address),
        // structured city column — preferred over parsing it out of the address string
        city: col(board.columns.city),
        status: col(board.columns.status),
      })
    }
    cursor = page.cursor
  } while (cursor)
  return contacts
}

/**
 * Both boards merged. Only the *same person* is deduped — matched on phone AND
 * name — so a lead that was converted to a customer appears once, while two
 * different people who happen to share a phone both stay visible for the user
 * to tell apart.
 */
async function loadContacts(apiKey) {
  if (!apiKey) throw new Error('MONDAY_API_KEY is not set')
  const perBoard = await Promise.all(BOARDS.map((b) => fetchBoard(b, apiKey)))

  // customer wins over lead; otherwise the record carrying more detail wins
  const score = (c) => (c.source === 'customer' ? 100 : 0) + (c.address ? 2 : 0) + (c.city ? 1 : 0)
  const identity = (c) => `${c.phoneDigits}|${c.name.trim().replace(/\s+/g, ' ').toLowerCase()}`

  const byIdentity = new Map()
  const merged = []
  for (const contact of perBoard.flat()) {
    if (!contact.phoneDigits || !contact.name.trim()) {
      merged.push(contact)
      continue
    }
    const key = identity(contact)
    const seen = byIdentity.get(key)
    if (!seen) {
      byIdentity.set(key, contact)
      merged.push(contact)
    } else if (score(contact) > score(seen)) {
      merged[merged.indexOf(seen)] = contact
      byIdentity.set(key, contact)
    }
  }
  return merged
}

/** Cached with stale-while-revalidate — a cold load pages ~1,900 leads and is too slow to block on. */
export async function fetchMondayContacts(apiKey) {
  const fresh = cache && Date.now() - cache.at < CACHE_TTL_MS
  if (fresh) return cache.data
  if (!inFlight) {
    inFlight = loadContacts(apiKey)
      .then((data) => {
        cache = { at: Date.now(), data }
        return data
      })
      .finally(() => {
        inFlight = null
      })
  }
  // stale data is served immediately; the refresh keeps running in the background
  if (cache) {
    inFlight.catch((err) => console.error('[monday] background refresh failed:', err.message))
    return cache.data
  }
  return inFlight
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/**
 * POST to the n8n webhook, retrying 5xx and network faults with backoff.
 * A 4xx is a wrong path or an inactive workflow — retrying it only delays the error.
 */
async function postToWebhook(webhookUrl, body) {
  let lastError = null
  for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
    try {
      const upstream = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      })
      if (upstream.ok) return { ok: true }

      const text = await upstream.text().catch(() => '')
      console.error(
        `[submit] attempt ${attempt}/${SUBMIT_ATTEMPTS} — webhook ${upstream.status} ${upstream.statusText}: ${text.slice(0, 2000)}`,
      )
      if (upstream.status < 500) {
        // 404 here means the n8n path is wrong or the workflow is not Active
        return { ok: false, upstreamStatus: upstream.status, body: text, retryable: false }
      }
      lastError = { ok: false, upstreamStatus: upstream.status, body: text, retryable: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      console.error(`[submit] attempt ${attempt}/${SUBMIT_ATTEMPTS} — webhook unreachable: ${message}`)
      lastError = { ok: false, upstreamStatus: null, body: message, retryable: true }
    }
    if (attempt < SUBMIT_ATTEMPTS) await sleep(SUBMIT_BACKOFF_MS[attempt - 1] ?? 1500)
  }
  return lastError
}

/** The human-readable part of an n8n error body ({"code":404,"message":"..."}), or the raw text. */
function upstreamMessage(body) {
  const text = String(body ?? '').trim()
  if (!text) return ''
  try {
    const parsed = JSON.parse(text)
    const msg = parsed?.message ?? parsed?.error ?? ''
    return String(msg || text).slice(0, 300)
  } catch {
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
  }
}

/**
 * Turn the webhook's 4xx into an actionable Hebrew message. The common case is
 * n8n's 404 "webhook ... is not registered": the workflow is inactive, or the
 * server was given the editor's /webhook-test/ URL, which only listens while
 * someone presses "Execute workflow".
 */
function describeWebhookRejection(status, body) {
  const msg = upstreamMessage(body)
  if (status === 404 && /not registered|webhook-test|Execute workflow|Test workflow/i.test(msg)) {
    return 'ה-workflow ב-n8n אינו פעיל או שכתובת ה-Webhook בשרת שגויה (כתובת test במקום production)'
  }
  if (status === 404) return 'כתובת ה-Webhook לא נמצאה ב-n8n (404) — נדרשת בדיקת WEBHOOK_URL בשרת'
  if (status === 413) return 'ההזמנה גדולה מדי עבור n8n (413) — נסו להקטין או להסיר תמונות'
  if (status === 401 || status === 403) return `n8n דחה את הבקשה (${status}) — חסימת גישה או הרשאה`
  return `ה-Webhook החזיר סטטוס ${status}${msg ? ` — ${msg}` : ''}`
}

/** Where the submit goes, without the secret webhook id: host + whether it is a test or production URL. */
function describeWebhookTarget(webhookUrl) {
  if (!webhookUrl) return null
  try {
    const u = new URL(webhookUrl)
    return { host: u.host, kind: /\/webhook-test\//.test(u.pathname) ? 'test' : 'production', path: u.pathname.replace(/[0-9a-f-]{36}/i, '…') }
  } catch {
    return { host: null, kind: 'invalid', path: null }
  }
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
    if (url.startsWith('/api/submit') && req.method === 'POST') {
      const webhookUrl = env.WEBHOOK_URL || env.VITE_WEBHOOK_URL
      if (!webhookUrl) {
        console.error('[submit] refused: neither WEBHOOK_URL nor VITE_WEBHOOK_URL is set')
        json(500, { error: 'כתובת ה-Webhook אינה מוגדרת בשרת (WEBHOOK_URL)', reason: 'not-configured' })
        return
      }
      let body
      try {
        body = await readBody(req)
      } catch (err) {
        json(400, { error: 'לא ניתן לקרוא את גוף הבקשה', reason: 'bad-request' })
        return
      }
      const result = await postToWebhook(webhookUrl, body)
      if (result.ok) {
        json(200, { ok: true })
        return
      }
      // 4xx upstream is a configuration fault; 5xx/unreachable is a transient one
      const configFault = result.upstreamStatus !== null && result.upstreamStatus < 500
      json(configFault ? 502 : 504, {
        error: configFault ? describeWebhookRejection(result.upstreamStatus, result.body) : 'שרת היעד אינו זמין כרגע',
        reason: configFault ? 'webhook-rejected' : 'webhook-unavailable',
        upstreamStatus: result.upstreamStatus,
        upstreamMessage: upstreamMessage(result.body),
      })
      return
    }
    if (url.startsWith('/api/monday/clients')) {
      try {
        json(200, { clients: await fetchMondayContacts(env.MONDAY_API_KEY) })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        console.error('[monday] client list failed:', message)
        json(502, { error: message })
      }
      return
    }
    if (url.startsWith('/api/order-number') && req.method === 'POST') {
      try {
        // ?type=quote draws from the quote sequence; anything else is an order
        const kind = new URL(url, 'http://local').searchParams.get('type') === 'quote' ? 'quote' : 'order'
        json(200, { orderNumber: await allocateOrderNumber(env, kind), kind })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error'
        console.error('[order-number] allocation failed:', message)
        json(500, { error: message })
      }
      return
    }
    if (url.startsWith('/api/health')) {
      json(200, {
        ok: true,
        webhookConfigured: Boolean(env.WEBHOOK_URL || env.VITE_WEBHOOK_URL),
        webhook: describeWebhookTarget(env.WEBHOOK_URL || env.VITE_WEBHOOK_URL),
        mondayConfigured: Boolean(env.MONDAY_API_KEY),
        contactsCached: cache ? cache.data.length : 0,
        contactsCachedAt: cache ? new Date(cache.at).toISOString() : null,
      })
      return
    }
    next()
  }
}
