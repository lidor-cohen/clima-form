import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormState } from './types'
import { DOC_TYPE_LABELS, PERCENT_PRESETS, defaultSchedule, emptyAddon, emptyItem, emptyOpening, emptyScheduledPayment, initialState } from './types'
import { buildPayload, fetchOrderNumber, submitToWebhook } from './payload'
import { StepCustomer } from './components/StepCustomer'
import { StepItems } from './components/StepItems'
import { StepPayments } from './components/StepPayments'
import { StepReview } from './components/StepReview'

const DRAFT_KEY = 'clima-order-draft-v2'

const STEPS = [
  { key: 'customer', label: 'לקוח' },
  { key: 'items', label: 'מוצרים' },
  { key: 'payments', label: 'תשלומים' },
  { key: 'review', label: 'סיכום' },
] as const

/** A quote has no received payments, so its third step is only the terms. */
const stepLabel = (key: (typeof STEPS)[number]['key'], isQuote: boolean) =>
  key === 'payments' && isQuote ? 'תנאים' : STEPS.find((s) => s.key === key)!.label

type Status = 'editing' | 'sending' | 'sent' | 'error'

type StoredDraft = { state: FormState; savedAt: string }

/** Merge a stored draft over current defaults so new fields don't crash old drafts. */
function mergeDraft(parsed: FormState): FormState {
  const base = initialState()
  return {
    ...base,
    ...parsed,
    docType: parsed.docType === 'quote' ? 'quote' : 'order',
    customer: { ...base.customer, ...parsed.customer },
    terms: {
      ...base.terms,
      ...parsed.terms,
      // drafts saved before the notes were editable carry none — start from the default
      notes: typeof parsed.terms?.notes === 'string' ? parsed.terms.notes : base.terms.notes,
      schedule: parsed.terms?.schedule?.length
        ? parsed.terms.schedule.map((p) => ({
            ...emptyScheduledPayment(),
            ...p,
            // drafts saved before the percent presets existed carry no choice
            percentChoice:
              p.percentChoice ?? (PERCENT_PRESETS.includes(p.percent) ? p.percent : p.percent ? 'other' : ''),
          }))
        : defaultSchedule(),
    },
    items: parsed.items?.length
      ? parsed.items.map((it) => ({
          ...emptyItem(),
          ...it,
          spec: it.spec ?? {},
          openings: (it.openings ?? []).map((o) => ({ ...emptyOpening(), ...o })),
          addons: (it.addons ?? []).map((a) => ({ ...emptyAddon(a.name ?? ''), ...a, entries: a.entries ?? [] })),
        }))
      : base.items,
    payments: parsed.payments ?? [],
  }
}

/**
 * Reads the saved draft without applying it. A fresh page load (or a refresh)
 * always starts on an empty form, with no banner: the previous draft is only
 * reachable through the small "שחזור" button in the top bar, until the user
 * starts typing a new order, which replaces it.
 */
function readDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft | FormState
    // drafts saved before the timestamp wrapper existed are the bare state
    const isWrapped = parsed && typeof parsed === 'object' && 'state' in parsed
    const stored = (isWrapped ? (parsed as StoredDraft).state : parsed) as FormState
    if (!stored || typeof stored !== 'object') return null
    return { state: mergeDraft(stored), savedAt: isWrapped ? (parsed as StoredDraft).savedAt : '' }
  } catch {
    return null
  }
}

const formatSavedAt = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

/** A draft worth offering: something was actually filled in. */
const isDraftMeaningful = (s: FormState) =>
  Boolean(s.customer.fullName.trim() || s.customer.phone.trim() || s.items.some((it) => it.product.trim()))

export default function App() {
  const [state, setState] = useState<FormState>(initialState)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('editing')
  const [errorMessage, setErrorMessage] = useState('')
  // the previous unsent order, restorable from the top bar while the form is still empty
  const [savedDraft, setSavedDraft] = useState<StoredDraft | null>(() => {
    const draft = readDraft()
    return draft && isDraftMeaningful(draft.state) ? draft : null
  })
  const [confirmingClear, setConfirmingClear] = useState(false)
  // bumped on reset so focus lands after React has committed the fresh form
  const [resetToken, setResetToken] = useState(0)
  const signature = useRef<string | null>(null)
  // order number allocated on first submit attempt, reused on retries
  const allocatedNumber = useRef<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const clearRef = useRef<HTMLDivElement>(null)

  const update = (fn: (s: FormState) => FormState) => setState(fn)

  useEffect(() => {
    // an empty form never overwrites the previous draft — that is what keeps it
    // restorable across a refresh; typing a new order replaces it
    if (!isDraftMeaningful(state)) return
    if (savedDraft) setSavedDraft(null)
    const t = setTimeout(() => {
      try {
        const payload: StoredDraft = { state, savedAt: new Date().toISOString() }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
      } catch {
        // quota exceeded (location photos are large) — the form keeps working
      }
    }, 300)
    return () => clearTimeout(t)
  }, [state, savedDraft])

  // dismiss the clear confirmation on any click outside it
  useEffect(() => {
    if (!confirmingClear) return
    const onDown = (e: PointerEvent) => {
      if (!clearRef.current?.contains(e.target as Node)) setConfirmingClear(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [confirmingClear])

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    if (resetToken === 0) return
    contentRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus()
  }, [resetToken])

  const validateStep = (i: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (i === 0) {
      if (!state.customer.fullName.trim()) e.fullName = 'נא למלא שם לקוח'
      if (!state.customer.phone.trim()) e.phone = 'נא למלא מספר טלפון'
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

  const isQuote = state.docType === 'quote'
  const docLabel = DOC_TYPE_LABELS[state.docType]

  const submit = async () => {
    // a quote goes out unsigned; an order is signed on the spot
    if (!isQuote && !signature.current) {
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
      // המספר נתפס רק ברגע השליחה — הזמנות והצעות ממוספרות בנפרד
      if (!allocatedNumber.current) {
        allocatedNumber.current = await fetchOrderNumber(state.docType)
      }
      const finalState: FormState = {
        ...state,
        orderNumber: allocatedNumber.current,
        orderDate: new Date().toISOString().slice(0, 10),
      }
      setState(finalState)
      await submitToWebhook(buildPayload(finalState, isQuote ? null : signature.current))
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        // nothing to do — the order is already sent
      }
      setStatus('sent')
      scrollTop()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'שגיאה לא צפויה')
      setStatus('error')
    }
  }

  /** Full reset: every field, the selected models, the totals and the saved draft. */
  const startNew = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // storage unavailable — the in-memory reset below still applies
    }
    signature.current = null
    allocatedNumber.current = null
    setState(initialState())
    setStatus('editing')
    setStep(0)
    setErrors({})
    setErrorMessage('')
    setSavedDraft(null)
    setConfirmingClear(false)
    scrollTop()
    setResetToken((n) => n + 1)
  }

  const resumeDraft = () => {
    if (!savedDraft) return
    setState(savedDraft.state)
    setSavedDraft(null)
    setStep(0)
    setErrors({})
  }

  const canResume = Boolean(savedDraft) && !isDraftMeaningful(state) && status === 'editing'

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step])

  if (status === 'sent') {
    return (
      <div className="app" ref={topRef}>
        <div className="done">
          <div className="done__icon">✓</div>
          <h1>{isQuote ? 'הצעת המחיר נשלחה בהצלחה' : 'ההזמנה נשלחה בהצלחה'}</h1>
          <p>
            {docLabel}
            {state.orderNumber ? ` מס' ${state.orderNumber}` : ''} עבור {state.customer.fullName} התקבלה במערכת
            {isQuote && state.customer.email ? ` ונשלחה במייל אל ${state.customer.email}` : ''}.
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
          <span className="topbar__tagline">{isQuote ? 'הצעת מחיר דיגיטלית' : 'טופס הזמנה דיגיטלי'}</span>
          <div className="topbar__actions" ref={clearRef}>
            {confirmingClear ? (
              <span className="confirm">
                <span className="confirm__text">לנקות את כל הטופס?</span>
                <button type="button" className="btn btn--danger" onClick={startNew}>
                  כן, נקה
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmingClear(false)}>
                  ביטול
                </button>
              </span>
            ) : canResume ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={resumeDraft}
                title={`${savedDraft?.state.customer.fullName || 'ללא שם'}${formatSavedAt(savedDraft?.savedAt ?? '') ? ` · נשמר ב-${formatSavedAt(savedDraft?.savedAt ?? '')}` : ''}`}
              >
                שחזור הטופס הקודם
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--danger-ghost"
                onClick={() => setConfirmingClear(true)}
                disabled={status === 'sending'}
              >
                ניקוי טופס / {isQuote ? 'הצעה חדשה' : 'הזמנה חדשה'}
              </button>
            )}
          </div>
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
              <span className="steps__label">{stepLabel(s.key, isQuote)}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="content" ref={contentRef}>
        {step === 0 && <StepCustomer state={state} update={update} errors={errors} />}
        {step === 1 && <StepItems state={state} update={update} errors={errors} />}
        {step === 2 && <StepPayments state={state} update={update} />}
        {step === 3 && (
          <StepReview
            state={state}
            update={update}
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
            {status === 'sending' ? 'שולח…' : isQuote ? 'שליחת הצעת המחיר' : 'שליחת ההזמנה'}
          </button>
        )}
      </footer>
    </div>
  )
}
