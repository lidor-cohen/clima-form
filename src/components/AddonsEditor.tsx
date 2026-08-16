import { useState } from 'react'
import type { ItemAddon } from '../types'
import { emptyAddon, emptyElectricEntry } from '../types'
import { addonShape } from '../specs'
import { Field, TextInput } from './ui'

type Props = {
  addons: ItemAddon[]
  types: string[]
  onChange: (addons: ItemAddon[]) => void
}

/** תוספות editor: type picker + per-type field rows — docx renderAddonPicker/addAddon. */
export function AddonsEditor({ addons, types, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const setAddon = (id: string, patch: Partial<ItemAddon>) =>
    onChange(addons.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  const addAddon = (name: string) => {
    const addon = emptyAddon(name)
    const shape = addonShape(name)
    if (shape.count) addon.qty = '1'
    if (shape.entries) addon.entries = [emptyElectricEntry()]
    onChange([...addons, addon])
    setPickerOpen(false)
  }

  return (
    <>
      <div className="addon-head">
        <p className="group-label">תוספות</p>
        <button
          type="button"
          className="btn btn--outline"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((open) => !open)}
        >
          + תוספות
        </button>
      </div>

      {pickerOpen && (
        <div className="addon-type-grid">
          {types.map((t) => (
            <button key={t} type="button" className="btn btn--outline" onClick={() => addAddon(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {addons.map((a) => {
        const shape = addonShape(a.name)
        return (
          <div className="addon-card" key={a.id}>
            <div className="addon-card__head">
              <span className="addon-card__name">{a.name}</span>
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={() => onChange(addons.filter((x) => x.id !== a.id))}
              >
                הסרה
              </button>
            </div>
            <div className="addon-card__fields">
              {shape.count && (
                <Field label="מספר">
                  <TextInput value={a.qty} inputMode="numeric" sanitize="int" onChange={(v) => setAddon(a.id, { qty: v })} />
                </Field>
              )}
              {shape.widthMm && (
                <Field label={shape.widthMm}>
                  <TextInput value={a.widthMm} inputMode="decimal" onChange={(v) => setAddon(a.id, { widthMm: v })} />
                </Field>
              )}
              {shape.heightMm && (
                <Field label={shape.heightMm}>
                  <TextInput value={a.heightMm} inputMode="decimal" onChange={(v) => setAddon(a.id, { heightMm: v })} />
                </Field>
              )}
              {shape.lengthM && (
                <Field label={shape.lengthM}>
                  <TextInput value={a.lengthM} inputMode="decimal" onChange={(v) => setAddon(a.id, { lengthM: v })} />
                </Field>
              )}
              {shape.spotCount && (
                <Field label={shape.spotCount}>
                  <TextInput value={a.spotCount} inputMode="numeric" sanitize="int" onChange={(v) => setAddon(a.id, { spotCount: v })} />
                </Field>
              )}
              {shape.option && (
                <Field label={shape.option.label}>
                  <select className="input" value={a.option} onChange={(e) => setAddon(a.id, { option: e.target.value })}>
                    <option value="">בחירה</option>
                    {shape.option.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {shape.note && (
                <Field label="פירוט התוספת" span2>
                  <textarea
                    className="input input--area"
                    rows={2}
                    placeholder="הקלדת מלל חופשי"
                    value={a.note}
                    onChange={(e) => setAddon(a.id, { note: e.target.value })}
                  />
                </Field>
              )}
              {shape.price && (
                <Field label="מחיר (₪)">
                  <TextInput value={a.priceIls} inputMode="decimal" suffix="₪" onChange={(v) => setAddon(a.id, { priceIls: v })} />
                </Field>
              )}
            </div>

            {shape.entries && (
              <div className="electric-entries">
                {a.entries.map((entry, i) => (
                  <div className="addon-card__fields electric-entry" key={entry.id}>
                    <Field label="מספר המערכת">
                      <TextInput
                        value={entry.systemNumber}
                        inputMode="numeric"
                        onChange={(v) =>
                          setAddon(a.id, {
                            entries: a.entries.map((x) => (x.id === entry.id ? { ...x, systemNumber: v } : x)),
                          })
                        }
                      />
                    </Field>
                    <Field label="מחיר (₪)">
                      <TextInput
                        value={entry.priceIls}
                        inputMode="decimal"
                        suffix="₪"
                        onChange={(v) =>
                          setAddon(a.id, {
                            entries: a.entries.map((x) => (x.id === entry.id ? { ...x, priceIls: v } : x)),
                          })
                        }
                      />
                    </Field>
                    {a.entries.length > 1 && (
                      <button
                        type="button"
                        className="btn btn--danger-ghost"
                        onClick={() => setAddon(a.id, { entries: a.entries.filter((x) => x.id !== entry.id) })}
                      >
                        הסרת מערכת חשמלית
                      </button>
                    )}
                    {i === a.entries.length - 1 && (
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={() => setAddon(a.id, { entries: [...a.entries, emptyElectricEntry()] })}
                      >
                        + הוספת מערכת חשמלית
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
