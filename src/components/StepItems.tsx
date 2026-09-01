import { useRef } from 'react'
import type { FormState, OrderItem } from '../types'
import { emptyItem, emptyOpening, formatIls } from '../types'
import { itemTotal, itemsTotal } from '../totals'
import { getAddonTypes, getSpecFields, initialSpecValues, openingsFor } from '../specs'
import { Field, SectionCard, TextInput } from './ui'
import { ProductPicker } from './ProductPicker'
import { SpecFields } from './SpecFields'
import { OpeningsBuilder } from './OpeningsBuilder'
import { FabricPicker } from './FabricPicker'
import { AddonsEditor } from './AddonsEditor'

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

  /**
   * Product change resets the spec-driven parts (docx behavior on reselect) and
   * the pricing fields with them. Clearing the product (the שינוי button) used to
   * leave priceIls behind: the pricing block is hidden while the product is empty,
   * so that price became invisible and uneditable yet still counted in the order
   * total. Deselecting now wipes the line back to an empty item.
   */
  const setProduct = (it: OrderItem, product: string) =>
    update((s) => ({
      ...s,
      items: s.items.map((row) =>
        row.id !== it.id
          ? row
          : product.trim() === ''
            ? { ...emptyItem(), id: row.id }
            : {
                ...row,
                product,
                spec: initialSpecValues(product),
                openings: openingsFor(product) ? [emptyOpening()] : [],
                addons: [],
                // a price belongs to the product it was quoted for
                priceIls: '',
                quantity: '1',
              },
      ),
    }))

  return (
    <>
      {state.items.map((it, i) => {
        const specFields = getSpecFields(it.product)
        const openingControl = openingsFor(it.product)
        const addonTypes = it.product.trim() ? getAddonTypes(it.product) : null
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
              <ProductPicker value={it.product} onChange={(v) => setProduct(it, v)} />
              {i === 0 && errors.firstProduct && (
                <span className="field__hint field__hint--error">{errors.firstProduct}</span>
              )}
            </div>

            {specFields && (
              <SpecFields
                fields={specFields}
                values={it.spec}
                onChange={(spec) => setItem(it.id, { spec })}
                markers={{
                  openings: openingControl ? (
                    <OpeningsBuilder
                      openings={it.openings}
                      control={openingControl}
                      onChange={(openings) => setItem(it.id, { openings })}
                    />
                  ) : undefined,
                  pleatedFabric: (
                    <FabricPicker
                      values={it.spec}
                      onChange={(patch) => setItem(it.id, { spec: { ...it.spec, ...patch } })}
                    />
                  ),
                }}
              />
            )}

            {/* pricing and the rest appear only once a product was chosen */}
            {it.product.trim() !== '' && (
              <>
                <p className="group-label">תמחור</p>
                <Field label="תיאור סעיף זה">
                  <textarea
                    className="input input--area"
                    rows={2}
                    placeholder="הקלדת מלל חופשי"
                    value={it.description}
                    onChange={(e) => setItem(it.id, { description: e.target.value })}
                  />
                </Field>
                <div className="grid">
                  <Field label="כמות">
                    <TextInput value={it.quantity} inputMode="numeric" sanitize="int" onChange={(v) => setItem(it.id, { quantity: v })} />
                  </Field>
                  <Field label="מחיר (₪)">
                    <TextInput value={it.priceIls} inputMode="decimal" suffix="₪" onChange={(v) => setItem(it.id, { priceIls: v })} />
                  </Field>
                </div>

                {addonTypes && (
                  <AddonsEditor
                    addons={it.addons}
                    types={addonTypes}
                    onChange={(addons) => setItem(it.id, { addons })}
                  />
                )}

                <p className="group-label">תמונת מיקום המערכת</p>
                <LocationPhoto value={it.locationImage} onChange={(v) => setItem(it.id, { locationImage: v })} />

                <div className="item-total">
                  <span>סה״כ למוצר (לפני מע״מ)</span>
                  <strong>{formatIls(itemTotal(it))}</strong>
                </div>
              </>
            )}
          </SectionCard>
        )
      })}

      <button type="button" className="btn btn--outline btn--block" onClick={addItem}>
        + הוסף מוצר
      </button>

      <div className="total-bar">
        <span>סה"כ הזמנה (לפני מע"מ)</span>
        <strong>{formatIls(itemsTotal(state))}</strong>
      </div>
    </>
  )
}
