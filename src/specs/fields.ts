import type { SpecValues } from '../types'

/**
 * The spec-section field vocabulary. Product-family config files return
 * SpecField[] and the generic renderer (components/SpecFields.tsx) draws them.
 * Mirrors the widget kinds of the docx prototype.
 */

/** Reveal a free-text field when the select holds a trigger value (אחר / מיוחד). */
export type SelectOther = { trigger: string; id: string; label: string }

/** Show a field only when another field matches (e.g. צד ההפעלה only for ידני). */
export type VisibleWhen = { id: string; equals?: string; notEmpty?: boolean }

export type SpecField =
  | { kind: 'heading'; label: string }
  | { kind: 'text'; id: string; label: string; defaultValue?: string; visibleWhen?: VisibleWhen }
  | { kind: 'number'; id: string; label: string; visibleWhen?: VisibleWhen }
  | { kind: 'price'; id: string; label?: string; visibleWhen?: VisibleWhen }
  | {
      kind: 'select'
      id: string
      label: string
      options: string[] | ((values: SpecValues) => string[])
      defaultValue?: string
      other?: SelectOther
      visibleWhen?: VisibleWhen
    }
  | { kind: 'textarea'; id: string; label: string }
  | { kind: 'buttons'; id: string; label: string; options: string[] }
  | { kind: 'checkbox'; id: string; label: string }
  | { kind: 'switch'; id: string; label: string; children: SpecField[] }
  | { kind: 'openings' }
  | { kind: 'pleatedFabric' }

// terse builders so the family config files read like the docx spec
export const heading = (label: string): SpecField => ({ kind: 'heading', label })
export const txt = (id: string, label: string, defaultValue?: string): SpecField => ({
  kind: 'text',
  id,
  label,
  defaultValue,
})
export const num = (id: string, label: string): SpecField => ({ kind: 'number', id, label })
export const price = (id: string, label?: string): SpecField => ({ kind: 'price', id, label })
export const sel = (
  id: string,
  label: string,
  options: string[] | ((values: SpecValues) => string[]),
  defaultValue?: string,
  other?: SelectOther,
): SpecField => ({ kind: 'select', id, label, options, defaultValue, other })
export const textarea = (id: string, label: string): SpecField => ({ kind: 'textarea', id, label })
export const checkbox = (id: string, label: string): SpecField => ({ kind: 'checkbox', id, label })
export const sw = (id: string, label: string, ...children: SpecField[]): SpecField => ({
  kind: 'switch',
  id,
  label,
  children,
})

export const SWITCH_ON = '1'

const fieldId = (f: SpecField): string | null => ('id' in f ? f.id : null)

export const isFieldVisible = (f: SpecField, values: SpecValues): boolean => {
  if (!('visibleWhen' in f) || !f.visibleWhen) return true
  const v = values[f.visibleWhen.id] ?? ''
  if (f.visibleWhen.notEmpty) return v !== ''
  return v === (f.visibleWhen.equals ?? '')
}

/** All value-holding ids under a field, including switch children and other-reveals. */
export function collectIds(f: SpecField): string[] {
  const ids: string[] = []
  const id = fieldId(f)
  if (id) ids.push(id)
  if (f.kind === 'select' && f.other) ids.push(f.other.id)
  if (f.kind === 'switch') for (const child of f.children) ids.push(...collectIds(child))
  return ids
}

/** Initial values: field defaults, applied when a product is (re)selected. */
export function specDefaults(fields: SpecField[]): SpecValues {
  const values: SpecValues = {}
  const visit = (f: SpecField) => {
    if ((f.kind === 'text' || f.kind === 'select') && f.defaultValue && 'id' in f) {
      values[f.id] = f.defaultValue
    }
    if (f.kind === 'switch') f.children.forEach(visit)
  }
  fields.forEach(visit)
  return values
}

/**
 * Walk the fields that are currently visible: switch children only when the
 * switch is on, visibleWhen respected. Used by totals, cleanup and the review.
 */
export function walkVisible(fields: SpecField[], values: SpecValues, cb: (f: SpecField) => void): void {
  for (const f of fields) {
    if (!isFieldVisible(f, values)) continue
    cb(f)
    if (f.kind === 'switch' && values[f.id] === SWITCH_ON) {
      walkVisible(f.children, values, cb)
    }
  }
}

/** Ids of visible price fields — the ones that feed the item total. */
export function visiblePriceIds(fields: SpecField[], values: SpecValues): string[] {
  const ids: string[] = []
  walkVisible(fields, values, (f) => {
    if (f.kind === 'price') ids.push(f.id)
  })
  return ids
}

/**
 * Clear values that became stale after a change: hidden visibleWhen targets,
 * children of switches that were turned off, other-reveals whose trigger was
 * deselected, and dynamic-select values no longer in their option list.
 * Returns a cleaned copy (docx behavior: closing a menu empties it).
 */
export function cleanSpecValues(fields: SpecField[], values: SpecValues): SpecValues {
  const next = { ...values }
  const visit = (f: SpecField, visible: boolean) => {
    const on = visible && isFieldVisible(f, next)
    const id = fieldId(f)
    if (!on) {
      if (id && next[id]) next[id] = ''
      if (f.kind === 'select' && f.other && next[f.other.id]) next[f.other.id] = ''
      if (f.kind === 'switch') f.children.forEach((c) => visit(c, false))
      return
    }
    if (f.kind === 'select') {
      const opts = typeof f.options === 'function' ? f.options(next) : f.options
      if (next[f.id] && !opts.includes(next[f.id])) next[f.id] = ''
      if (f.other && next[f.other.id] && next[f.id] !== f.other.trigger) next[f.other.id] = ''
    }
    if (f.kind === 'switch') {
      const open = next[f.id] === SWITCH_ON
      f.children.forEach((c) => visit(c, open))
    }
  }
  fields.forEach((f) => visit(f, true))
  return next
}

/** One legible line of the spec for the review page and the webhook payload. */
export type SpecLine = { id: string; label: string; value: string }

export function describeFields(fields: SpecField[], values: SpecValues): SpecLine[] {
  const lines: SpecLine[] = []
  walkVisible(fields, values, (f) => {
    if (f.kind === 'heading' || f.kind === 'openings' || f.kind === 'pleatedFabric') return
    if (f.kind === 'switch' || f.kind === 'checkbox') {
      if (values[f.id] === SWITCH_ON) lines.push({ id: f.id, label: f.label, value: 'כן' })
      return
    }
    const v = values[f.id] ?? ''
    if (v) lines.push({ id: f.id, label: f.label ?? 'מחיר (₪)', value: v })
    if (f.kind === 'select' && f.other && values[f.id] === f.other.trigger) {
      const otherValue = values[f.other.id] ?? ''
      if (otherValue) lines.push({ id: f.other.id, label: f.other.label, value: otherValue })
    }
  })
  return lines
}
