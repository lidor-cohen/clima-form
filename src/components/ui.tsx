import type { ReactNode } from 'react'

type FieldProps = {
  label: string
  children: ReactNode
  hint?: string
  error?: string
  /** softer than an error: the value is usable but needs the user's attention */
  warning?: string
  required?: boolean
  span2?: boolean
}

export function Field({ label, children, hint, error, warning, required, span2 }: FieldProps) {
  return (
    <label
      className={`field${span2 ? ' field--span2' : ''}${error ? ' field--error' : ''}${
        !error && warning ? ' field--warning' : ''
      }`}
    >
      <span className="field__label">
        {label}
        {required && <span className="field__required">*</span>}
      </span>
      {children}
      {error ? (
        <span className="field__hint field__hint--error">{error}</span>
      ) : warning ? (
        <span className="field__hint field__hint--warning">{warning}</span>
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
  /** keystroke-level positive-number filter; decimal inputs get it by default */
  sanitize?: 'int' | 'decimal'
}

const sanitizeInt = (v: string) => v.replace(/\D/g, '')
const sanitizeDecimal = (v: string) => {
  const s = v.replace(/[^\d.]/g, '')
  const i = s.indexOf('.')
  return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
}

export function TextInput({ value, onChange, type = 'text', inputMode, placeholder, autoComplete, suffix, sanitize }: TextInputProps) {
  const mode = sanitize ?? (inputMode === 'decimal' ? 'decimal' : undefined)
  const input = (
    <input
      className="input"
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(e) => {
        const raw = e.target.value
        onChange(mode === 'int' ? sanitizeInt(raw) : mode === 'decimal' ? sanitizeDecimal(raw) : raw)
      }}
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
