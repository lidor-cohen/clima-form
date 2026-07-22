import type { FormState } from '../types'
import { PAYMENT_METHOD_LABELS, formatIls, itemsTotal, parseAmount, paymentsTotal } from '../types'
import { SectionCard } from './ui'
import { SignaturePad } from './SignaturePad'

type Props = {
  state: FormState
  onSignature: (dataUrl: string | null) => void
  signatureError?: string
  goToStep: (i: number) => void
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="review-row">
      <span className="review-row__label">{label}</span>
      <span className="review-row__value">{value}</span>
    </div>
  )
}

export function StepReview({ state, onSignature, signatureError, goToStep }: Props) {
  const c = state.customer
  const address = [c.street && `${c.street} ${c.houseNumber}`.trim(), c.floor && `קומה ${c.floor}`, c.city]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <SectionCard
        title="לקוח"
        actions={<button type="button" className="btn btn--ghost" onClick={() => goToStep(0)}>עריכה</button>}
      >
        <Row label="שם" value={c.fullName} />
        <Row label="עסק" value={c.businessName} />
        <Row label="טלפון" value={[c.phone, c.phone2].filter(Boolean).join(' / ')} />
        <Row label="אימייל" value={c.email} />
        <Row label="כתובת" value={address} />
        <Row label="מס' הזמנה" value={state.orderNumber} />
        <Row label="תאריך" value={state.orderDate} />
        <Row label="סוכן" value={state.agentName} />
      </SectionCard>

      <SectionCard
        title="מוצרים"
        actions={<button type="button" className="btn btn--ghost" onClick={() => goToStep(1)}>עריכה</button>}
      >
        {state.items.map((it, i) => {
          const dims = [
            it.lengthCm && `אורך ${it.lengthCm}`,
            it.projectionCm && `יציאה ${it.projectionCm}`,
            it.heightCm && `גובה ${it.heightCm}`,
          ]
            .filter(Boolean)
            .join(' × ')
          return (
            <div className="review-item" key={it.id}>
              <div className="review-item__head">
                <strong>{it.product || `מוצר ${i + 1}`}</strong>
                {it.priceIls && <span>{formatIls(parseAmount(it.priceIls))}</span>}
              </div>
              {dims && <p className="review-item__dims">{dims} ס״מ</p>}
              <p className="review-item__meta">
                {[it.frameColor && `צבע: ${it.frameColor}`, it.cover && `כיסוי: ${it.cover}`, it.finish && `גימור: ${it.finish}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          )
        })}
        <div className="review-row review-row--total">
          <span className="review-row__label">סה"כ</span>
          <span className="review-row__value">{formatIls(itemsTotal(state))}</span>
        </div>
      </SectionCard>

      {state.payments.length > 0 && (
        <SectionCard
          title="תשלומים"
          actions={<button type="button" className="btn btn--ghost" onClick={() => goToStep(2)}>עריכה</button>}
        >
          {state.payments.map((p, i) => (
            <Row
              key={p.id}
              label={`${i + 1}. ${PAYMENT_METHOD_LABELS[p.method]}${p.checkNumber ? ` ${p.checkNumber}` : ''}`}
              value={p.amountIls ? formatIls(parseAmount(p.amountIls)) : '—'}
            />
          ))}
          <div className="review-row review-row--total">
            <span className="review-row__label">סה"כ שולם</span>
            <span className="review-row__value">{formatIls(paymentsTotal(state))}</span>
          </div>
        </SectionCard>
      )}

      <SectionCard title="חתימת המזמין" subtitle="הלקוח מאשר בזאת כי ידועים לו כל פרטי ההזמנה והתנאים המפורטים">
        <SignaturePad onChange={onSignature} />
        {signatureError && <p className="field__hint field__hint--error">{signatureError}</p>}
      </SectionCard>
    </>
  )
}
