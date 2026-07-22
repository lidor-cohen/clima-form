import type { FormState } from '../types'
import { Field, SectionCard } from './ui'

type Props = {
  state: FormState
  update: (fn: (s: FormState) => FormState) => void
}

export function StepNotes({ state, update }: Props) {
  return (
    <SectionCard title="הוראות התקנה" subtitle="הערות, דגשים והנחיות למתקינים">
      <Field label="הוראות והערות">
        <textarea
          className="input input--area"
          rows={10}
          value={state.installationNotes}
          placeholder={'לדוגמה:\n• נקודת חשמל קיימת בקיר צפוני\n• נדרש אישור ועד בית\n• גישה דרך חניון'}
          onChange={(e) => update((s) => ({ ...s, installationNotes: e.target.value }))}
        />
      </Field>
    </SectionCard>
  )
}
