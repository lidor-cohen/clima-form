import type { SpecValues } from '../types'
import { PLEATED_FABRICS, PLEATED_FABRIC_TYPES } from '../specs/catalogs'
import { Field } from './ui'

type Props = {
  values: SpecValues
  onChange: (patch: SpecValues) => void
}

/** Pleated-blind fabric picker: type select → hex swatch grid — docx renderPleatedFabricColors. */
export function FabricPicker({ values, onChange }: Props) {
  const type = values.pleatedFabricType ?? ''
  const color = values.pleatedFabricColor ?? ''
  const swatches = PLEATED_FABRICS[type] ?? []

  return (
    <div className="fabric-picker">
      <Field label="סוג הבד">
        <select
          className="input"
          value={type}
          onChange={(e) => onChange({ pleatedFabricType: e.target.value, pleatedFabricColor: '' })}
        >
          <option value="">בחירה</option>
          {PLEATED_FABRIC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      {swatches.length > 0 && (
        <div className="field">
          <span className="field__label">צבע הבד</span>
          <div className="fabric-grid">
            {swatches.map((fabric) => (
              <button
                key={fabric.name}
                type="button"
                className={`fabric-swatch-btn${color === fabric.name ? ' fabric-swatch-btn--selected' : ''}`}
                onClick={() => onChange({ pleatedFabricColor: fabric.name })}
              >
                <span className="fabric-swatch" style={{ background: fabric.color }} aria-hidden="true" />
                <span>{fabric.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
