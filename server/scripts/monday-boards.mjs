#!/usr/bin/env node
/**
 * Maps the Monday account for the שם הלקוח picker and the address parser:
 * every board the key can see, its groups, its columns (id, title, type) and a
 * sample of address/city values. Run it once with the key, paste the output
 * into the session, and BOARDS in server/monday.mjs can be extended from it.
 *
 *   MONDAY_API_KEY=... node server/scripts/monday-boards.mjs            # all boards
 *   MONDAY_API_KEY=... node server/scripts/monday-boards.mjs 5099980319  # one board, more samples
 *
 * Read-only: only `boards`, `groups`, `columns` and a page of items are queried.
 */

const apiKey = process.env.MONDAY_API_KEY
if (!apiKey) {
  console.error('MONDAY_API_KEY is not set')
  process.exit(1)
}
const onlyBoard = process.argv[2] || null
const SAMPLE_ROWS = onlyBoard ? 60 : 8

async function gql(query, variables = {}) {
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json', 'API-Version': '2024-10' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Monday API responded ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
  return json.data
}

const ADDRESS_LIKE = /כתובת|רחוב|address|street|עיר|ישוב|יישוב|city/i
const CONTACT_TYPES = new Set(['phone', 'email', 'location'])

async function listBoards() {
  const boards = []
  for (let page = 1; ; page++) {
    const data = await gql(
      `query ($page: Int!, $ids: [ID!]) {
        boards(limit: 100, page: $page, ids: $ids, state: active) {
          id name board_kind type items_count
          workspace { id name }
          groups { id title }
          columns { id title type }
        }
      }`,
      { page, ids: onlyBoard ? [onlyBoard] : null },
    )
    boards.push(...data.boards)
    if (data.boards.length < 100 || onlyBoard) break
  }
  // sub-item boards carry the same contacts as their parents; skip them
  return boards.filter((b) => b.type !== 'sub_items_board')
}

async function sampleItems(board, columnIds) {
  if (!columnIds.length) return []
  const data = await gql(
    `query ($board: [ID!], $cols: [String!], $limit: Int!) {
      boards(ids: $board) { items_page(limit: $limit) { items { id name group { id } column_values(ids: $cols) { id text } } } }
    }`,
    { board: [board.id], cols: columnIds, limit: SAMPLE_ROWS },
  )
  return data.boards[0]?.items_page?.items ?? []
}

const boards = await listBoards()
console.log(`# ${boards.length} boards\n`)

for (const b of boards) {
  const interesting = b.columns.filter((c) => CONTACT_TYPES.has(c.type) || ADDRESS_LIKE.test(c.title))
  console.log(`## ${b.name}  (id ${b.id}, ${b.board_kind}, ${b.items_count ?? '?'} items, workspace "${b.workspace?.name ?? '-'}")`)
  console.log(`groups: ${b.groups.map((g) => `${g.title} [${g.id}]`).join(' | ')}`)
  console.log('columns:')
  for (const c of b.columns) {
    const mark = interesting.includes(c) ? ' *' : ''
    console.log(`  ${c.id.padEnd(22)} ${c.type.padEnd(12)} ${c.title}${mark}`)
  }
  if (interesting.length && (b.items_count ?? 1) > 0) {
    const items = await sampleItems(b, interesting.map((c) => c.id))
    console.log('samples:')
    for (const it of items) {
      const vals = it.column_values.filter((v) => v.text).map((v) => `${v.id}="${v.text}"`).join('  ')
      console.log(`  [${it.group?.id}] ${it.name}: ${vals}`)
    }
  }
  console.log()
}
