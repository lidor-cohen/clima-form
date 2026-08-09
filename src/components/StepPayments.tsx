import type { FormState, PaymentEntry, PaymentMethod, PaymentMilestone, ScheduledPayment } from '../types'
import {
  MILESTONE_LABELS,
  PAYMENT_METHOD_LABELS,
  emptyPayment,
  emptyScheduledPayment,
  formatIls,
  itemsTotal,
  paymentsTotal,
} from '../types'
import { Field, SectionCard, TextInput } from './ui'

type Props = {
  state: FormState
  update: (fn: (s: FormState) => FormState) => void
}

export function StepPayments({ state, update }: Props) {
  const setTerms = (patch: Partial<FormState['terms']>) =>
    update((s) => ({ ...s, terms: { ...s.terms, ...patch } }))

  const setScheduled = (id: string, patch: Partial<ScheduledPayment>) =>
    update((s) => ({
      ...s,
      terms: { ...s.terms, schedule: s.terms.schedule.map((p) => (p.id === id ? { ...p, ...patch } : p)) },
    }))

  const addScheduled = () =>
    update((s) => ({ ...s, terms: { ...s.terms, schedule: [...s.terms.schedule, emptyScheduledPayment()] } }))

  const removeScheduled = (id: string) =>
    update((s) => ({ ...s, terms: { ...s.terms, schedule: s.terms.schedule.filter((p) => p.id !== id) } }))

  const setPayment = (id: string, patch: Partial<PaymentEntry>) =>
    update((s) => ({ ...s, payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))

  const addPayment = () => update((s) => ({ ...s, payments: [...s.payments, emptyPayment()] }))

  const removePayment = (id: string) =>
    update((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) }))

  const balance = itemsTotal(state) - paymentsTotal(state)

  return (
    <>
      <SectionCard title="תנאים">
        <div className="grid">
          <Field label="זמן אספקה" hint="ימי עבודה מיום קבלת התשלום או המדידה הסופית — המוקדם מביניהם" span2>
            <TextInput value={state.terms.measurementDays} inputMode="numeric" suffix="ימי עבודה" onChange={(v) => setTerms({ measurementDays: v })} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="תנאי תשלום" subtitle="פירוט שלבי התשלום שסוכמו עם הלקוח">
        {state.terms.schedule.map((p, i) => (
          <div className="payment-row" key={p.id}>
            <div className="payment-row__head">
              <span className="payment-row__index">תשלום {i + 1}</span>
              <button type="button" className="btn btn--danger-ghost" onClick={() => removeScheduled(p.id)}>
                הסר
              </button>
            </div>
            <div className="grid">
              <Field label="מועד" span2>
                <select
                  className="input"
                  value={p.milestone}
                  onChange={(e) => setScheduled(p.id, { milestone: e.target.value as PaymentMilestone })}
                >
                  {(Object.keys(MILESTONE_LABELS) as PaymentMilestone[]).map((m) => (
                    <option key={m} value={m}>
                      {MILESTONE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </Field>
              {p.milestone === 'other' && (
                <Field label="פירוט המועד" span2>
                  <TextInput value={p.milestoneOther} placeholder="מלל חופשי" onChange={(v) => setScheduled(p.id, { milestoneOther: v })} />
                </Field>
              )}
              <Field label="אחוז">
                <TextInput value={p.percent} inputMode="decimal" suffix="%" onChange={(v) => setScheduled(p.id, { percent: v })} />
              </Field>
              <Field label="סכום">
                <TextInput value={p.amountIls} inputMode="decimal" suffix="₪" onChange={(v) => setScheduled(p.id, { amountIls: v })} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn--outline btn--block" onClick={addScheduled}>
          + הוסף תשלום
        </button>
      </SectionCard>

      <SectionCard title="קבלה זמנית" subtitle="פירוט תשלומים / שיקים">
        {state.payments.length === 0 && <p className="empty-note">לא נוספו תשלומים עדיין.</p>}
        {state.payments.map((p, i) => (
          <div className="payment-row" key={p.id}>
            <div className="payment-row__head">
              <span className="payment-row__index">תשלום {i + 1}</span>
              <button type="button" className="btn btn--danger-ghost" onClick={() => removePayment(p.id)}>
                הסר
              </button>
            </div>
            <div className="grid">
              <Field label="אמצעי תשלום">
                <select
                  className="input"
                  value={p.method}
                  onChange={(e) => setPayment(p.id, { method: e.target.value as PaymentMethod })}
                >
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="סכום">
                <TextInput value={p.amountIls} inputMode="decimal" suffix="₪" onChange={(v) => setPayment(p.id, { amountIls: v })} />
              </Field>
              {p.method === 'check' && (
                <>
                  <Field label="מס' שיק">
                    <TextInput value={p.checkNumber} inputMode="numeric" onChange={(v) => setPayment(p.id, { checkNumber: v })} />
                  </Field>
                  <Field label="בנק">
                    <TextInput value={p.bank} onChange={(v) => setPayment(p.id, { bank: v })} />
                  </Field>
                </>
              )}
              <Field label="תאריך">
                <TextInput type="date" value={p.date} onChange={(v) => setPayment(p.id, { date: v })} />
              </Field>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn--outline btn--block" onClick={addPayment}>
          + הוסף תשלום
        </button>
      </SectionCard>

      <div className="total-bar total-bar--stack">
        <div>
          <span>סה"כ הזמנה</span>
          <strong>{formatIls(itemsTotal(state))}</strong>
        </div>
        <div>
          <span>שולם / שיקים</span>
          <strong>{formatIls(paymentsTotal(state))}</strong>
        </div>
        <div className={balance > 0 ? 'total-bar__balance' : ''}>
          <span>יתרה</span>
          <strong>{formatIls(balance)}</strong>
        </div>
      </div>
    </>
  )
}
