import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Sequential order-number allocator, persisted to a JSON file so numbers
 * survive restarts. Mount ORDER_DATA_DIR (default ./data) as a volume in
 * production, otherwise the counter resets on redeploy.
 */

let queue = Promise.resolve(0)

/** Orders and quotes are numbered independently, each in its own file. */
const SEQUENCES = {
  order: { file: 'order-counter.json', startVar: 'ORDER_NUMBER_START', defaultStart: 1800 },
  quote: { file: 'quote-counter.json', startVar: 'QUOTE_NUMBER_START', defaultStart: 1 },
}

function counterFile(env, kind) {
  return join(env.ORDER_DATA_DIR || './data', SEQUENCES[kind].file)
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

export function allocateOrderNumber(env, kind = 'order') {
  const seq = SEQUENCES[kind] ?? SEQUENCES.order
  const start = Number(env[seq.startVar] || seq.defaultStart)
  const file = counterFile(env, seq === SEQUENCES.order ? 'order' : 'quote')
  queue = queue.then(() => {
    const next = readLast(file, start) + 1
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ last: next }))
    return next
  })
  return queue
}
