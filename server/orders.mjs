import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Sequential order-number allocator, persisted to a JSON file so numbers
 * survive restarts. Mount ORDER_DATA_DIR (default ./data) as a volume in
 * production, otherwise the counter resets on redeploy.
 */

let queue = Promise.resolve(0)

function counterFile(env) {
  return join(env.ORDER_DATA_DIR || './data', 'order-counter.json')
}

function readLast(file, start) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8'))
    if (Number.isInteger(parsed.last)) return parsed.last
  } catch {
    // first run — no counter yet
  }
  return start - 1
}

export function allocateOrderNumber(env) {
  const start = Number(env.ORDER_NUMBER_START || 1800)
  const file = counterFile(env)
  queue = queue.then(() => {
    const next = readLast(file, start) + 1
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ last: next }))
    return next
  })
  return queue
}
