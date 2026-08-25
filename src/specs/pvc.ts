import type { SpecField } from './fields'
import { heading, num, price, sel, sw, txt, checkbox } from './fields'
import { LIGHTING_TINTS } from './catalogs'
import { PVC_LEVELED } from './classify'

/** מפרט פרגולת PVC — docx renderPergolaSpec */
export function pvcSpec(product: string): SpecField[] {
  return [
    heading('מידות משוערות'),
    num('widthMm', 'רוחב (מ״מ)'),
    num('projectionMm', 'יציאה (מ״מ)'),
    sw(
      'additionalColumns',
      'עמודים נוספים',
      num('additionalColumnsCount', 'מספר העמודים'),
      price('additionalColumnsPrice'),
    ),
    checkbox('roofOption', product === PVC_LEVELED ? 'מרזב היקפי' : 'קירוי קשתי'),
    heading('צבעים'),
    txt('aluminumColor', 'צבע אלומיניום'),
    txt('pvcColor', 'PVC'),
    sel('lightingTint', 'גוון תאורה', LIGHTING_TINTS, 'ללא'),
  ]
}
