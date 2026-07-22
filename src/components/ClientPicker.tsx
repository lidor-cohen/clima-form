import { useEffect, useRef, useState } from 'react'
import type { MondayClient } from '../monday'
import { fetchMondayClients } from '../monday'

let clientsCache: MondayClient[] | null = null

type Props = {
  value: string
  linked: boolean
  onChangeText: (v: string) => void
  onSelect: (client: MondayClient) => void
}

export function ClientPicker({ value, linked, onChangeText, onSelect }: Props) {
  const [clients, setClients] = useState<MondayClient[]>(clientsCache ?? [])
  const [open, setOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (clientsCache) return
    fetchMondayClients()
      .then((list) => {
        clientsCache = list
        setClients(list)
      })
      .catch(() => setLoadFailed(true))
  }, [])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const q = value.trim().toLowerCase()
  const matches = q
    ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    : clients

  return (
    <div className="picker" ref={wrapRef}>
      <input
        className="input"
        type="text"
        value={value}
        placeholder={clients.length ? 'חיפוש לקוח קיים או שם חדש' : 'שם מלא'}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChangeText(e.target.value)
          setOpen(true)
        }}
      />
      {linked && <span className="picker__badge">✓ לוח לקוחות</span>}
      {open && matches.length > 0 && (
        <ul className="picker__list">
          {matches.slice(0, 30).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="picker__option"
                onClick={() => {
                  onSelect(c)
                  setOpen(false)
                }}
              >
                <span className="picker__name">{c.name}</span>
                {c.phone && <span className="picker__meta">{c.phone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {loadFailed && <span className="field__hint">רשימת הלקוחות מ-monday לא נטענה — אפשר להקליד ידנית</span>}
    </div>
  )
}
