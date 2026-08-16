import type { ReactNode } from 'react'
import type { SpecValues } from '../types'
import type { SpecField } from '../specs/fields'
import { SWITCH_ON, cleanSpecValues, isFieldVisible } from '../specs/fields'
import { Field, TextInput } from './ui'

type Props = {
  fields: SpecField[]
  values: SpecValues
  onChange: (values: SpecValues) => void
  /** rendered in place of the openings / pleatedFabric marker fields */
  markers?: Partial<Record<'openings' | 'pleatedFabric', ReactNode>>
}

export function SpecFields({ fields, values, onChange, markers }: Props) {
  const set = (id: string, value: string) =>
    onChange(cleanSpecValues(fields, { ...values, [id]: value }))

  const renderField = (f: SpecField, key: string): ReactNode => {
    if (!isFieldVisible(f, values)) return null
    switch (f.kind) {
      case 'heading':
        return (
          <p key={key} className="group-label spec-full">
            {f.label}
          </p>
        )
      case 'text':
        return (
          <Field key={key} label={f.label}>
            <TextInput value={values[f.id] ?? ''} onChange={(v) => set(f.id, v)} />
          </Field>
        )
      case 'number':
        return (
          <Field key={key} label={f.label}>
            <TextInput value={values[f.id] ?? ''} inputMode="decimal" onChange={(v) => set(f.id, v)} />
          </Field>
        )
      case 'price':
        return (
          <Field key={key} label={f.label ?? 'מחיר (₪)'}>
            <TextInput value={values[f.id] ?? ''} inputMode="decimal" suffix="₪" onChange={(v) => set(f.id, v)} />
          </Field>
        )
      case 'select': {
        const options = typeof f.options === 'function' ? f.options(values) : f.options
        const value = values[f.id] ?? ''
        return (
          <span key={key} className="spec-pair">
            <Field label={f.label}>
              <select className="input" value={value} onChange={(e) => set(f.id, e.target.value)}>
                <option value="">בחירה</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            {f.other && value === f.other.trigger && (
              <Field label={f.other.label}>
                <TextInput value={values[f.other.id] ?? ''} onChange={(v) => set(f.other!.id, v)} />
              </Field>
            )}
          </span>
        )
      }
      case 'textarea':
        return (
          <Field key={key} label={f.label} span2>
            <textarea
              className="input input--area"
              rows={2}
              placeholder="הקלדת מלל חופשי"
              value={values[f.id] ?? ''}
              onChange={(e) => set(f.id, e.target.value)}
            />
          </Field>
        )
      case 'buttons':
        return (
          <div key={key} className="field spec-full">
            <span className="field__label">{f.label}</span>
            <div className="choice-row">
              {f.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={`btn ${values[f.id] === o ? 'btn--primary' : 'btn--outline'}`}
                  onClick={() => set(f.id, o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )
      case 'checkbox':
        return (
          <label key={key} className="switch-row spec-full">
            <input
              type="checkbox"
              checked={values[f.id] === SWITCH_ON}
              onChange={(e) => set(f.id, e.target.checked ? SWITCH_ON : '')}
            />
            <span>{f.label}</span>
          </label>
        )
      case 'switch': {
        const on = values[f.id] === SWITCH_ON
        return (
          <div key={key} className="spec-full">
            <label className="switch-row">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => set(f.id, e.target.checked ? SWITCH_ON : '')}
              />
              <span>{f.label}</span>
            </label>
            {on && (
              <div className="spec-reveal spec-grid">
                {f.children.map((child, i) => renderField(child, `${key}-${i}`))}
              </div>
            )}
          </div>
        )
      }
      case 'openings':
        return (
          <div key={key} className="spec-full">
            {markers?.openings ?? null}
          </div>
        )
      case 'pleatedFabric':
        return (
          <div key={key} className="spec-full">
            {markers?.pleatedFabric ?? null}
          </div>
        )
    }
  }

  return <div className="spec-grid">{fields.map((f, i) => renderField(f, `f-${i}`))}</div>
}
