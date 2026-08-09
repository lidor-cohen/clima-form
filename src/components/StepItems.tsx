import { useRef } from 'react'
import type { FormState, ItemAddon, OrderItem } from '../types'
import { GLASS_ADDON_NAME, GLASS_CATEGORY, emptyItem, formatIls, itemsTotal, uid } from '../types'
import { findSelection } from '../products'
import { Field, SectionCard, TextInput } from './ui'
import { ProductPicker } from './ProductPicker'

type Props = {
  state: FormState
  update: (fn: (s: FormState) => FormState) => void
  errors: Record<string, string>
}

/** Downscale + JPEG-compress a photo so the webhook payload stays small. */
async function compressImage(file: File, maxDim = 1280, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image load failed'))
      el.src = url
    })
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function LocationPhoto({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="photo">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onChange(await compressImage(file))
        }}
      />
      {value ? (
        <div className="photo__preview">
          <img className="photo__img" src={value} alt="מיקום המערכת" />
          <div className="photo__actions">
            <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
              החלפה
            </button>
            <button type="button" className="btn btn--danger-ghost" onClick={() => onChange('')}>
              הסרה
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--outline btn--block" onClick={() => inputRef.current?.click()}>
          📷 צילום / העלאת תמונה של מיקום המערכת
        </button>
      )}
    </div>
  )
}

export function StepItems({ state, update, errors }: Props) {
  const setItem = (id: string, patch: Partial<OrderItem>) =>
    update((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))

  const addItem = () => update((s) => ({ ...s, items: [...s.items, emptyItem()] }))

  const removeItem = (id: string) =>
    update((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }))

  const setAddon = (it: OrderItem, addonId: string, patch: Partial<ItemAddon>) =>
    setItem(it.id, { addons: it.addons.map((a) => (a.id === addonId ? { ...a, ...patch } : a)) })

  return (
    <>
      {state.items.map((it, i) => {
        const isGlass = findSelection(it.product)?.category.name === GLASS_CATEGORY
        return (
          <SectionCard
            key={it.id}
            title={`מוצר ${i + 1}`}
            subtitle={it.product || undefined}
            actions={
              state.items.length > 1 ? (
                <button type="button" className="btn btn--danger-ghost" onClick={() => removeItem(it.id)}>
                  הסר
                </button>
              ) : undefined
            }
          >
            {/* div (not label): the picker holds many buttons and a label would forward clicks */}
            <div className={`field field--picker${i === 0 && errors.firstProduct ? ' field--error' : ''}`}>
              <span className="field__label">
                המוצר<span className="field__required">*</span>
              </span>
              <ProductPicker value={it.product} onChange={(v) => setItem(it.id, { product: v })} />
              {i === 0 && errors.firstProduct && (
                <span className="field__hint field__hint--error">{errors.firstProduct}</span>
              )}
            </div>

            <div className="grid">
              <Field label="צבע">
                <TextInput value={it.frameColor} onChange={(v) => setItem(it.id, { frameColor: v })} />
              </Field>
              <Field label="גימור">
                <TextInput value={it.finish} onChange={(v) => setItem(it.id, { finish: v })} />
              </Field>
            </div>

            <p className="group-label">מידות (ס״מ)</p>
            <div className="grid grid--4">
              <Field label="אורך">
                <TextInput value={it.lengthCm} inputMode="decimal" onChange={(v) => setItem(it.id, { lengthCm: v })} />
              </Field>
              <Field label="יציאה">
                <TextInput value={it.projectionCm} inputMode="decimal" onChange={(v) => setItem(it.id, { projectionCm: v })} />
              </Field>
              <Field label="גובה">
                <TextInput value={it.heightCm} inputMode="decimal" onChange={(v) => setItem(it.id, { heightCm: v })} />
              </Field>
              <Field label="ג. התקנה">
                <TextInput value={it.installationHeightCm} inputMode="decimal" onChange={(v) => setItem(it.id, { installationHeightCm: v })} />
              </Field>
            </div>

            <div className="grid">
              <Field label="פתיחה">
                <TextInput value={it.opening} placeholder="כיוון / סוג פתיחה" onChange={(v) => setItem(it.id, { opening: v })} />
              </Field>
              <Field label="כיסוי">
                <TextInput value={it.cover} onChange={(v) => setItem(it.id, { cover: v })} />
              </Field>
              <Field label="צבע כיסוי">
                <TextInput value={it.coverColor} onChange={(v) => setItem(it.id, { coverColor: v })} />
              </Field>
              <Field label='סה"כ ש"ח'>
                <TextInput value={it.priceIls} inputMode="decimal" suffix="₪" onChange={(v) => setItem(it.id, { priceIls: v })} />
              </Field>
            </div>

            {isGlass && (
              <>
                <p className="group-label">תוספות</p>
                {it.addons.map((addon) => (
                  <div className="addon-row" key={addon.id}>
                    <span className="addon-row__name">{addon.name}</span>
                    <Field label="מספר">
                      <TextInput value={addon.qty} inputMode="numeric" onChange={(v) => setAddon(it, addon.id, { qty: v })} />
                    </Field>
                    <Field label="מחיר">
                      <TextInput value={addon.priceIls} inputMode="decimal" suffix="₪" onChange={(v) => setAddon(it, addon.id, { priceIls: v })} />
                    </Field>
                    <button
                      type="button"
                      className="btn btn--danger-ghost"
                      onClick={() => setItem(it.id, { addons: it.addons.filter((a) => a.id !== addon.id) })}
                    >
                      הסר
                    </button>
                  </div>
                ))}
                {it.addons.length === 0 && (
                  <button
                    type="button"
                    className="btn btn--outline btn--block"
                    onClick={() =>
                      setItem(it.id, {
                        addons: [...it.addons, { id: uid(), name: GLASS_ADDON_NAME, qty: '1', priceIls: '' }],
                      })
                    }
                  >
                    + {GLASS_ADDON_NAME}
                  </button>
                )}
              </>
            )}

            <p className="group-label">תמונת מיקום המערכת</p>
            <LocationPhoto value={it.locationImage} onChange={(v) => setItem(it.id, { locationImage: v })} />
          </SectionCard>
        )
      })}

      <button type="button" className="btn btn--outline btn--block" onClick={addItem}>
        + הוסף מוצר
      </button>

      <div className="total-bar">
        <span>סה"כ הזמנה</span>
        <strong>{formatIls(itemsTotal(state))}</strong>
      </div>
    </>
  )
}
