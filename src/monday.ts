export type MondayClient = {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

export async function fetchMondayClients(): Promise<MondayClient[]> {
  const res = await fetch('/api/monday/clients')
  if (!res.ok) throw new Error(`clients endpoint responded ${res.status}`)
  const json = (await res.json()) as { clients: MondayClient[] }
  return json.clients
}

/** "972544558962" → "054-4558962", leaves other formats as-is */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw
  const local = digits.startsWith('972') ? '0' + digits.slice(3) : digits
  if (/^0\d{9}$/.test(local)) return `${local.slice(0, 3)}-${local.slice(3)}`
  return local
}

/** "המסגר 3 נתניה" → street/number/city; falls back to everything in street */
export function parseAddress(raw: string): { street: string; houseNumber: string; city: string } {
  const trimmed = raw.trim()
  const full = trimmed.match(/^(.+?)\s+(\d+[א-ת]?)\s+(.+)$/)
  if (full) return { street: full[1], houseNumber: full[2], city: full[3] }
  const noCity = trimmed.match(/^(.+?)\s+(\d+[א-ת]?)$/)
  if (noCity) return { street: noCity[1], houseNumber: noCity[2], city: '' }
  return { street: trimmed, houseNumber: '', city: '' }
}
