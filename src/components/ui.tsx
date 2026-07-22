import type { ReactNode } from 'react'

type FieldProps = {
  label: string
  children: ReactNode
  hint?: string
  error?: string
  required?: boolean
  span2?: boolean
}

export function Field({ label, children, hint, error, required, span2 }: FieldProps) {
  return (
    <label className={`field${span2 ? ' field--span2' : ''}${error ? ' field--error' : ''}`}>
      <span className="field__label">
        {label}
        {required && <span className="field__required">*</span>}
      </span>
      {children}
      {error ? (
        <span className="field__hint field__hint--error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </label>
  )
}

type TextInputProps = {
  value: string
  onChange: (v: string) => void
  type?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email'
  placeholder?: string
  autoComplete?: string
  suffix?: string
}

export function TextInput({ value, onChange, type = 'text', inputMode, placeholder, autoComplete, suffix }: TextInputProps) {
  const input = (
    <input
      className="input"
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
    />
  )
  if (!suffix) return input
  return (
    <span className="input-wrap">
      {input}
      <span className="input-wrap__suffix">{suffix}</span>
    </span>
  )
}

export function SectionCard({ title, subtitle, children, actions }: { title?: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card">
      {(title || actions) && (
        <header className="card__header">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
