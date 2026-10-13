import type { FormState } from '../types'
import { AGENTS, DOC_TYPE_LABELS } from '../types'
import type { DocType } from '../types'
import { normalizePhone } from '../monday'
import { parseAddress } from '../address'
import { ClientPicker } from './ClientPicker'
import { Field, SectionCard, TextInput } from './ui'

type Props = {
  state: FormState
  update: (fn: (s: FormState) => FormState) => void
  errors: Record<string, string>
}

export function StepCustomer({ state, update, errors }: Props) {
  const c = state.customer
  const setCustomer = (patch: Partial<FormState['customer']>) =>
    update((s) => ({ ...s, customer: { ...s.customer, ...patch } }))

  return (
    <>
      <SectionCard
        title={state.docType === 'quote' ? 'פרטי הצעת המחיר' : 'פרטי הזמנה'}
        subtitle={
          state.docType === 'quote'
            ? 'הצעת מחיר נשלחת ללקוח במייל ללא חתימה; מספר ההצעה נקבע אוטומטית בעת השליחה'
            : 'מספר ההזמנה והתאריך נקבעים אוטומטית בעת שליחת הטופס'
        }
      >
        <div className="grid">
          <div className="field field--span2">
            <span className="field__label">סוג המסמך</span>
            <div className="segmented" role="radiogroup" aria-label="סוג המסמך">
              {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={state.docType === t}
                  className={`segmented__item${state.docType === t ? ' segmented__item--active' : ''}`}
                  onClick={() => update((s) => ({ ...s, docType: t }))}
                >
                  {DOC_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <Field label="יועץ" span2>
            <select
              className="input"
              value={state.agentName}
              onChange={(e) => update((s) => ({ ...s, agentName: e.target.value }))}
            >
              <option value="">בחירת יועץ</option>
              {AGENTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="פרטי הלקוח">
        <div className="grid">
          <Field
            label="שם הלקוח"
            required
            error={errors.fullName}
            hint={c.mondayItemId ? undefined : 'חיפוש בלוח הלקוחות ובלוח הלידים — בחירה תמלא טלפון, מייל וכתובת'}
            span2
          >
            <ClientPicker
              value={c.fullName}
              linked={Boolean(c.mondayItemId)}
              onChangeText={(v) =>
                setCustomer({ fullName: v, mondayItemId: '', mondayBoardId: '', recordType: '' })
              }
              onSelect={(contact) => {
                // the structured city column wins; the free text supplies the rest
                const addr = parseAddress(contact.address, contact.city)
                // every contact-derived field is replaced, not merged: picking a
                // different person must not leave the previous one's city or
                // phone behind
                setCustomer({
                  mondayItemId: contact.id,
                  mondayBoardId: contact.boardId,
                  recordType: contact.source,
                  fullName: contact.name,
                  phone: contact.phone ? normalizePhone(contact.phone) : '',
                  email: contact.email,
                  street: addr.street,
                  houseNumber: addr.houseNumber,
                  floor: addr.floor,
                  apartment: addr.apartment,
                  entrance: addr.entrance,
                  city: addr.city,
                  // an unresolved city is flagged rather than filled with a guess
                  cityNeedsReview: addr.cityAmbiguous && !addr.city,
                })
              }}
            />
          </Field>
          <Field label="שם העסק">
            <TextInput value={c.businessName} autoComplete="organization" onChange={(v) => setCustomer({ businessName: v })} />
          </Field>
          <Field label="ת.ז / ח.פ">
            <TextInput value={c.idNumber} inputMode="numeric" onChange={(v) => setCustomer({ idNumber: v })} />
          </Field>
          <Field label="טלפון" required error={errors.phone}>
            <TextInput value={c.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="050-0000000" onChange={(v) => setCustomer({ phone: v })} />
          </Field>
          <Field label="טלפון נוסף">
            <TextInput value={c.phone2} type="tel" inputMode="tel" onChange={(v) => setCustomer({ phone2: v })} />
          </Field>
          <Field label="אימייל" error={errors.email} span2>
            <TextInput value={c.email} type="email" inputMode="email" autoComplete="email" placeholder="name@example.com" onChange={(v) => setCustomer({ email: v })} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="כתובת">
        <div className="grid">
          <Field label="רחוב" span2>
            <TextInput value={c.street} autoComplete="street-address" onChange={(v) => setCustomer({ street: v })} />
          </Field>
          <Field label="מס' בית">
            <TextInput value={c.houseNumber} inputMode="numeric" onChange={(v) => setCustomer({ houseNumber: v })} />
          </Field>
          <Field label="קומה">
            <TextInput value={c.floor} onChange={(v) => setCustomer({ floor: v })} />
          </Field>
          <Field label="דירה">
            <TextInput value={c.apartment} onChange={(v) => setCustomer({ apartment: v })} />
          </Field>
          <Field label="כניסה">
            <TextInput value={c.entrance} onChange={(v) => setCustomer({ entrance: v })} />
          </Field>
          <Field
            label="ישוב"
            span2
            warning={c.cityNeedsReview ? 'לא זוהה ישוב בכתובת שבמאנדיי — נא למלא ידנית' : undefined}
          >
            <TextInput
              value={c.city}
              onChange={(v) => setCustomer({ city: v, cityNeedsReview: c.cityNeedsReview && v.trim() === '' })}
            />
          </Field>
        </div>
      </SectionCard>
    </>
  )
}
