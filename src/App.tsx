import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormState } from './types'
import { initialState } from './types'
import { buildPayload, submitToWebhook } from './payload'
import { StepCustomer } from './components/StepCustomer'
import { StepItems } from './components/StepItems'
import { StepPayments } from './components/StepPayments'
import { StepNotes } from './components/StepNotes'
import { StepReview } from './components/StepReview'

const DRAFT_KEY = 'clima-order-draft-v1'

const STEPS = [
  { key: 'customer', label: 'לקוח' },
  { key: 'items', label: 'מוצרים' },
  { key: 'payments', label: 'תשלומים' },
  { key: 'notes', label: 'התקנה' },
  { key: 'review', label: 'סיכום' },
] as const

type Status = 'editing' | 'sending' | 'sent' | 'error'

function loadDraft(): FormState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as FormState
    // merge over defaults so new fields added later don't crash old drafts
    const base = initialState()
    return {
      ...base,
      ...parsed,
      customer: { ...base.customer, ...parsed.customer },
      terms: { ...base.terms, ...parsed.terms },
      items: parsed.items?.length ? parsed.items : base.items,
      payments: parsed.payments ?? [],
    }
  } catch {
    return initialState()
  }
}

export default function App() {
  const [state, setState] = useState<FormState>(loadDraft)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('editing')
  const [errorMessage, setErrorMessage] = useState('')
  const signature = useRef<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const update = (fn: (s: FormState) => FormState) => setState(fn)

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(state)), 300)
    return () => clearTimeout(t)
  }, [state])

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' })

  const validateStep = (i: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (i === 0) {
      if (!state.customer.fullName.trim()) e.fullName = 'נא למלא שם לקוח'
      if (!state.customer.phone.trim()) e.phone = 'נא למלא מספר טלפון'
      if (!state.orderDate) e.orderDate = 'נא לבחור תאריך'
      if (state.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customer.email)) e.email = 'כתובת אימייל לא תקינה'
    }
    if (i === 1) {
      if (!state.items.some((it) => it.product.trim())) e.firstProduct = 'נא למלא לפחות מוצר אחד'
    }
    return e
  }

  const goToStep = (i: number) => {
    setErrors({})
    setStep(i)
    scrollTop()
  }

  const next = () => {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    goToStep(Math.min(step + 1, STEPS.length - 1))
  }

  const back = () => goToStep(Math.max(step - 1, 0))

  const submit = async () => {
    if (!signature.current) {
      setErrors({ signature: 'נדרשת חתימת הלקוח לפני שליחה' })
      return
    }
    // re-validate everything before sending
    const all = { ...validateStep(0), ...validateStep(1) }
    if (Object.keys(all).length > 0) {
      setErrors(all)
      goToStep(Object.keys(validateStep(0)).length > 0 ? 0 : 1)
      return
    }
    setErrors({})
    setStatus('sending')
    try {
      await submitToWebhook(buildPayload(state, signature.current))
      localStorage.removeItem(DRAFT_KEY)
      setStatus('sent')
      scrollTop()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'שגיאה לא צפויה')
      setStatus('error')
    }
  }

  const startNew = () => {
    localStorage.removeItem(DRAFT_KEY)
    signature.current = null
    setState(initialState())
    setStatus('editing')
    setStep(0)
    setErrors({})
    scrollTop()
  }

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step])

  if (status === 'sent') {
    return (
      <div className="app" ref={topRef}>
        <div className="done">
          <div className="done__icon">✓</div>
          <h1>ההזמנה נשלחה בהצלחה</h1>
          <p>
            הזמנה{state.orderNumber ? ` מס' ${state.orderNumber}` : ''} עבור {state.customer.fullName} התקבלה במערכת.
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={startNew}>
            טופס חדש
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app" ref={topRef}>
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo">CLIMA</span>
          <span className="topbar__tagline">טופס הזמנה דיגיטלי</span>
        </div>
        <div className="progress">
          <div className="progress__bar" style={{ width: `${progress}%` }} />
        </div>
        <nav className="steps">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`steps__item${i === step ? ' steps__item--active' : ''}${i < step ? ' steps__item--done' : ''}`}
              onClick={() => i < step && goToStep(i)}
            >
              <span className="steps__dot">{i < step ? '✓' : i + 1}</span>
              <span className="steps__label">{s.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {step === 0 && <StepCustomer state={state} update={update} errors={errors} />}
        {step === 1 && <StepItems state={state} update={update} errors={errors} />}
        {step === 2 && <StepPayments state={state} update={update} />}
        {step === 3 && <StepNotes state={state} update={update} />}
        {step === 4 && (
          <StepReview
            state={state}
            onSignature={(d) => {
              signature.current = d
              if (d) setErrors((e) => ({ ...e, signature: '' }))
            }}
            signatureError={errors.signature || undefined}
            goToStep={goToStep}
          />
        )}

        {status === 'error' && (
          <div className="alert alert--error">
            <strong>השליחה נכשלה.</strong> {errorMessage}
          </div>
        )}
      </main>

      <footer className="navbar">
        {step > 0 ? (
          <button type="button" className="btn btn--ghost" onClick={back} disabled={status === 'sending'}>
            חזרה
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn--primary" onClick={next}>
            המשך
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={submit} disabled={status === 'sending'}>
            {status === 'sending' ? 'שולח…' : 'שליחת ההזמנה'}
          </button>
        )}
      </footer>
    </div>
  )
}
