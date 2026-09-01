/** A contact from either monday board — לקוחות (customers) or לידים (leads). */
export type MondayContact = {
  id: string
  /** which board the record lives on; sent with the order so n8n updates the right row */
  boardId: string
  source: 'customer' | 'lead'
  name: string
  phone: string
  /** digits only, 972-prefix folded to a leading 0 — what search matches against */
  phoneDigits: string
  email: string
  /** free text: street, house number and often floor/apartment */
  address: string
  /** structured city column — preferred over parsing the city out of `address` */
  city: string
  /** סטטוס ליד, leads only */
  status: string
}

export async function fetchMondayContacts(): Promise<MondayContact[]> {
  const res = await fetch('/api/monday/clients')
  if (!res.ok) throw new Error(`clients endpoint responded ${res.status}`)
  const json = (await res.json()) as { clients: MondayContact[] }
  return json.clients
}

/**
 * Digits only, Israeli 972-prefix folded to a leading 0.
 * Search compares these, so "054-455" finds a record stored as "972544558962".
 */
export function toPhoneDigits(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('972') ? '0' + digits.slice(3) : digits
}

/** "972544558962" → "054-4558962", leaves other formats as-is */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw
  const local = digits.startsWith('972') ? '0' + digits.slice(3) : digits
  if (/^0\d{9}$/.test(local)) return `${local.slice(0, 3)}-${local.slice(3)}`
  return local
}
