import type { SpecField } from './fields'
import { heading, num, price, sel, sw } from './fields'
import { BH_TYPES, EASY_GLAZE_PANELS, FIXED_COLOR_OPTIONS, FIXED_LIGHTING_TINTS } from './catalogs'
import { EASY_GLAZE, FIXED_PERGOLA } from './classify'

/** מפרט פרגולה קבועה — docx renderFixedSpec */
export function fixedSpec(product: string): SpecField[] {
  const fields: SpecField[] = [
    heading('מידות משוערות'),
    num('widthMm', 'רוחב (מ״מ)'),
    num('projectionMm', 'יציאה (מ״מ)'),
    sw(
      'additionalColumns',
      'עמודים נוספים',
      num('additionalColumnsCount', 'מספר העמודים'),
      price('additionalColumnsPrice'),
    ),
    heading('צבעים'),
  ]

  if (product === FIXED_PERGOLA) {
    fields.push(
      sel('constructionColor', 'צבע קונסטרוקציה', FIXED_COLOR_OPTIONS, undefined, {
        trigger: 'מיוחד',
        id: 'constructionColorCustom',
        label: 'צבע קונסטרוקציה — מיוחד',
      }),
      sel('louversColor', 'צבע הרפפות', FIXED_COLOR_OPTIONS, undefined, {
        trigger: 'מיוחד',
        id: 'louversColorCustom',
        label: 'צבע הרפפות — מיוחד',
      }),
    )
  } else {
    fields.push(sel('aluminumColor', 'צבע אלומיניום', FIXED_COLOR_OPTIONS.slice(0, -1)))
  }

  if (product === EASY_GLAZE) {
    fields.push(sel('easyGlazePanel', 'לוח איזי גלייז', EASY_GLAZE_PANELS))
  } else {
    fields.push(sel('bhType', 'סוג ה־BH', BH_TYPES))
  }

  fields.push(
    sw('gutter', 'מרזב', num('gutterLengthM', 'אורך כולל (מטר רץ)'), price('gutterPrice')),
    sw(
      'bentSheets',
      'פחים מכופפים',
      num('bentSheetsLengthM', 'אורך כולל (מטר רץ)'),
      price('bentSheetsPrice'),
    ),
    sw(
      'integralLighting',
      'תאורה אינטגרלית',
      num('integralLightingLengthM', 'אורך כולל (מטר רץ)'),
      sel('integralLightingTint', 'צבע התאורה', FIXED_LIGHTING_TINTS),
    ),
  )

  return fields
}
