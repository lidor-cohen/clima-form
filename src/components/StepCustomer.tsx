import type { FormState } from '../types'
import { AGENTS } from '../types'
import { normalizePhone, parseAddress } from '../monday'
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
      <SectionCard title="פרטי הזמנה">
        <div className="grid">
          <Field label="מס' הזמנה">
            <TextInput value={state.orderNumber} inputMode="numeric" placeholder="1914" onChange={(v) => update((s) => ({ ...s, orderNumber: v }))} />
          </Field>
          <Field label="תאריך" required error={errors.orderDate}>
            <TextInput type="date" value={state.orderDate} onChange={(v) => update((s) => ({ ...s, orderDate: v }))} />
          </Field>
          <Field label="סוכן" span2>
            <select
              className="input"
              value={state.agentName}
              onChange={(e) => update((s) => ({ ...s, agentName: e.target.value }))}
            >
              <option value="">בחירת סוכן</option>
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
          <Field label="שם הלקוח" required error={errors.fullName} hint={c.mondayItemId ? undefined : 'בחירת לקוח קיים תמלא טלפון, מייל וכתובת אוטומטית'} span2>
            <ClientPicker
              value={c.fullName}
              linked={Boolean(c.mondayItemId)}
              onChangeText={(v) => setCustomer({ fullName: v, mondayItemId: '' })}
              onSelect={(client) => {
                const addr = parseAddress(client.address)
                setCustomer({
                  mondayItemId: client.id,
                  fullName: client.name,
                  phone: client.phone ? normalizePhone(client.phone) : c.phone,
                  email: client.email || c.email,
                  street: addr.street || c.street,
                  houseNumber: addr.houseNumber || c.houseNumber,
                  city: addr.city || c.city,
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
            <TextInput value={c.floor} inputMode="numeric" onChange={(v) => setCustomer({ floor: v })} />
          </Field>
          <Field label="ישוב" span2>
            <TextInput value={c.city} onChange={(v) => setCustomer({ city: v })} />
          </Field>
        </div>
      </SectionCard>
    </>
  )
}
