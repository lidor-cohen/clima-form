import { useEffect, useMemo, useRef, useState } from 'react'
import type { MondayContact } from '../monday'
import { fetchMondayContacts, toPhoneDigits } from '../monday'

let contactsCache: MondayContact[] | null = null

const MAX_RESULTS = 50
const DEBOUNCE_MS = 200

type Props = {
  value: string
  linked: boolean
  onChangeText: (v: string) => void
  onSelect: (contact: MondayContact) => void
}

/**
 * Ranks a contact against the query. Substring matches count (Hebrew names are
 * searched mid-word all the time), but a name that starts with the query is a
 * better hit and must not be pushed off the end of the list by one that merely
 * contains it.
 */
function score(contact: MondayContact, q: string, digits: string): number {
  const name = contact.name.toLowerCase()
  if (digits && contact.phoneDigits.includes(digits)) return contact.phoneDigits.startsWith(digits) ? 90 : 70
  if (!q) return 0
  if (name === q) return 100
  if (name.startsWith(q)) return 80
  if (name.split(/\s+/).some((w) => w.startsWith(q))) return 60
  if (name.includes(q)) return 40
  return -1
}

export function ClientPicker({ value, linked, onChangeText, onSelect }: Props) {
  const [contacts, setContacts] = useState<MondayContact[]>(contactsCache ?? [])
  const [open, setOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [query, setQuery] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contactsCache) return
    fetchMondayContacts()
      .then((list) => {
        contactsCache = list
        setContacts(list)
      })
      .catch(() => setLoadFailed(true))
  }, [])

  // debounced: filtering runs over ~1,900 records, too much for every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(value), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [value])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return contacts.slice(0, MAX_RESULTS)
    // a query of digits is a phone search; compare normalised digits so that
    // "054-455" finds a record monday stores as "972544558962"
    const digits = toPhoneDigits(q)
    return contacts
      .map((c) => ({ c, s: score(c, q, digits) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s || a.c.name.localeCompare(b.c.name, 'he'))
      .slice(0, MAX_RESULTS)
      .map((r) => r.c)
  }, [contacts, query])

  return (
    <div className="picker" ref={wrapRef}>
      <input
        className="input"
        type="text"
        value={value}
        placeholder={contacts.length ? 'חיפוש לקוח או ליד קיים, או שם חדש' : 'שם מלא'}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChangeText(e.target.value)
          setOpen(true)
        }}
      />
      {linked && <span className="picker__badge">✓ מקושר</span>}
      {open && matches.length > 0 && (
        <ul className="picker__list">
          {matches.map((c) => (
            <li key={`${c.boardId}-${c.id}`}>
              <button
                type="button"
                className="picker__option"
                onClick={() => {
                  onSelect(c)
                  setOpen(false)
                }}
              >
                <span className="picker__name">{c.name}</span>
                <span className="picker__meta">
                  <span className={`picker__source picker__source--${c.source}`}>
                    {c.source === 'customer' ? 'לקוח' : 'ליד'}
                  </span>
                  {/* phone and city disambiguate people who share a name */}
                  {c.phone && <span>{c.phone}</span>}
                  {c.city && <span>{c.city}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {loadFailed && <span className="field__hint">רשימת הלקוחות מ-monday לא נטענה — אפשר להקליד ידנית</span>}
    </div>
  )
}
