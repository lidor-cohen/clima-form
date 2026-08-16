import type { FormState } from '../types'
import {
  PAYMENT_METHOD_LABELS,
  formatIls,
  milestoneText,
  parseAmount,
  paymentsTotal,
} from '../types'
import { itemTotal, itemsTotal } from '../totals'
import { describeSpec } from '../specs'
import { PRICE_NOTES, WARRANTY_TERMS } from '../terms'
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
  const scheduled = state.terms.schedule.filter((p) => p.percent || p.amountIls || p.milestone !== 'other' || p.milestoneOther)

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
        <Row label="מס' הזמנה" value="נקבע אוטומטית לאחר החתימה" />
        <Row label="יועץ" value={state.agentName} />
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
          const specLines = describeSpec(it)
          const quantity = parseAmount(it.quantity)
          return (
            <div className="review-item" key={it.id}>
              <div className="review-item__head">
                <strong>
                  {it.product || `מוצר ${i + 1}`}
                  {quantity > 1 && ` × ${quantity}`}
                </strong>
                {itemTotal(it) > 0 && <span>{formatIls(itemTotal(it))}</span>}
              </div>
              {it.description && <p className="review-item__meta">{it.description}</p>}
              {dims && <p className="review-item__dims">{dims} ס״מ</p>}
              {specLines.length > 0 && (
                <p className="review-item__meta">
                  {specLines.map((l) => `${l.label}: ${l.value}`).join(' · ')}
                </p>
              )}
              {it.openings
                .filter((o) => o.widthMm || o.heightMm || o.opening)
                .map((o, oi) => (
                  <p className="review-item__meta" key={o.id}>
                    מפתח {oi + 1}: {[o.widthMm && o.heightMm ? `${o.widthMm}×${o.heightMm} מ״מ` : o.widthMm ? `רוחב ${o.widthMm} מ״מ` : o.heightMm ? `גובה ${o.heightMm} מ״מ` : '', o.opening].filter(Boolean).join(' — ')}
                  </p>
                ))}
              <p className="review-item__meta">
                {[it.frameColor && `צבע: ${it.frameColor}`, it.cover && `כיסוי: ${it.cover}`, it.finish && `גימור: ${it.finish}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {it.addons.map((a) => {
                const details = [
                  a.qty && `× ${a.qty}`,
                  a.widthMm && `רוחב ${a.widthMm} מ״מ`,
                  a.heightMm && `גובה ${a.heightMm} מ״מ`,
                  a.lengthM && `${a.lengthM} מטר רץ`,
                  a.spotCount && `${a.spotCount} ספוטים`,
                  a.option,
                  a.note,
                  a.priceIls && `— ${formatIls(parseAmount(a.priceIls))}`,
                ].filter(Boolean)
                return (
                  <div key={a.id}>
                    <p className="review-item__meta">
                      + {a.name}
                      {details.length > 0 && ` ${details.join(' · ')}`}
                    </p>
                    {a.entries
                      .filter((e) => e.systemNumber || e.priceIls)
                      .map((e) => (
                        <p className="review-item__meta review-item__meta--sub" key={e.id}>
                          מערכת {e.systemNumber || '—'}
                          {e.priceIls && ` — ${formatIls(parseAmount(e.priceIls))}`}
                        </p>
                      ))}
                  </div>
                )
              })}
              {it.locationImage && <img className="review-item__photo" src={it.locationImage} alt="מיקום המערכת" />}
            </div>
          )
        })}
        <div className="review-row review-row--total">
          <span className="review-row__label">סה"כ (לפני מע"מ)</span>
          <span className="review-row__value">{formatIls(itemsTotal(state))}</span>
        </div>
      </SectionCard>

      {scheduled.length > 0 && (
        <SectionCard
          title="תנאי תשלום"
          actions={<button type="button" className="btn btn--ghost" onClick={() => goToStep(2)}>עריכה</button>}
        >
          {scheduled.map((p, i) => (
            <Row
              key={p.id}
              label={`${i + 1}. ${milestoneText(p)}`}
              value={[p.percent && `${p.percent}%`, p.amountIls && formatIls(parseAmount(p.amountIls))].filter(Boolean).join(' · ') || '—'}
            />
          ))}
        </SectionCard>
      )}

      {state.payments.length > 0 && (
        <SectionCard
          title="קבלה זמנית"
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

      <SectionCard title="הערות ותנאי אחריות">
        <ul className="terms-list">
          {PRICE_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
          {WARRANTY_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="חתימת המזמין"
        subtitle="הלקוח מאשר בזאת כי ידועים לו כל פרטי ההזמנה, תנאי האחריות והתנאים המפורטים לעיל"
      >
        <SignaturePad onChange={onSignature} />
        {signatureError && <p className="field__hint field__hint--error">{signatureError}</p>}
      </SectionCard>
    </>
  )
}
