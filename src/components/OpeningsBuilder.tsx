import type { OpeningRow } from '../types'
import { emptyOpening } from '../types'
import type { OpeningControl } from '../specs'
import { OPENING_OPTIONS } from '../specs/catalogs'
import { Field, TextInput } from './ui'

const CENTER_OPENING = 'פתיחת אמצע'

type Props = {
  openings: OpeningRow[]
  control: OpeningControl
  onChange: (rows: OpeningRow[]) => void
}

/** מפתחים builder for folding-glass products — docx addOpening/renumberOpenings. */
export function OpeningsBuilder({ openings, control, onChange }: Props) {
  const rows = openings.length > 0 ? openings : [emptyOpening()]

  const setRow = (id: string, patch: Partial<OpeningRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="openings">
      {rows.map((row, i) => (
        <div className="opening-row" key={row.id}>
          <span className="opening-row__index">מפתח {i + 1}</span>
          <div className="opening-row__fields">
            <Field label="רוחב (מ״מ)">
              <TextInput value={row.widthMm} inputMode="decimal" onChange={(v) => setRow(row.id, { widthMm: v })} />
            </Field>
            <Field label="גובה (מ״מ)">
              <TextInput value={row.heightMm} inputMode="decimal" onChange={(v) => setRow(row.id, { heightMm: v })} />
            </Field>
            {control === 'select' && (
              <Field label="פתיחה">
                <select
                  className="input"
                  value={row.opening}
                  onChange={(e) => setRow(row.id, { opening: e.target.value })}
                >
                  <option value="">בחירה</option>
                  {OPENING_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {control === 'centerToggle' && (
              <button
                type="button"
                className={`btn opening-row__toggle ${row.opening === CENTER_OPENING ? 'btn--primary' : 'btn--outline'}`}
                onClick={() =>
                  setRow(row.id, { opening: row.opening === CENTER_OPENING ? '' : CENTER_OPENING })
                }
              >
                {CENTER_OPENING}
              </button>
            )}
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              className="btn btn--danger-ghost"
              onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
            >
              הסרת מפתח
            </button>
          )}
        </div>
      ))}
      <button type="button" className="btn btn--outline btn--block" onClick={() => onChange([...rows, emptyOpening()])}>
        + הוספת מפתח
      </button>
    </div>
  )
}
