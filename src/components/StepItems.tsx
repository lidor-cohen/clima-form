import type { FormState, OrderItem } from '../types'
import { emptyItem, formatIls, itemsTotal } from '../types'
import { Field, SectionCard, TextInput } from './ui'

type Props = {
  state: FormState
  update: (fn: (s: FormState) => FormState) => void
  errors: Record<string, string>
}

export function StepItems({ state, update, errors }: Props) {
  const setItem = (id: string, patch: Partial<OrderItem>) =>
    update((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))

  const addItem = () => update((s) => ({ ...s, items: [...s.items, emptyItem()] }))

  const removeItem = (id: string) =>
    update((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }))

  return (
    <>
      {state.items.map((it, i) => (
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
          <div className="grid">
            <Field label="המוצר" required error={i === 0 ? errors.firstProduct : undefined} span2>
              <TextInput value={it.product} placeholder='לדוגמה: פרגולת סאמו' onChange={(v) => setItem(it.id, { product: v })} />
            </Field>
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
        </SectionCard>
      ))}

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
