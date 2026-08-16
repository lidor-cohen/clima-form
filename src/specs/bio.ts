import type { SpecField } from './fields'
import { heading, num, price, sel, sw, txt } from './fields'
import { BIO_LIGHTING_TINTS } from './catalogs'

/** מפרט פרגולה ביואקלימית — docx renderBioSpec */
export function bioSpec(): SpecField[] {
  return [
    heading('מידות משוערות'),
    num('widthMm', 'רוחב (מ״מ)'),
    num('projectionMm', 'יציאה (מ״מ)'),
    sw(
      'rearLegs',
      'רגליים אחוריות',
      num('rearLegsCount', 'מספר רגליים אחוריות'),
      price('rearLegsPrice'),
    ),
    heading('צבעים'),
    txt('aluminumColor', 'צבע אלומיניום', 'לבן'),
    sw(
      'differentLouvers',
      'צבע רפרפות שונה',
      txt('louversColor', 'צבע רפרפות'),
      price('differentLouversPrice', 'מחיר צבע רפרפות שונה (₪)'),
    ),
    heading('תאורה'),
    sw(
      'perimeterLight',
      'תאורה היקפית',
      sel('perimeterLightTint', 'גוון תאורה', BIO_LIGHTING_TINTS),
      price('perimeterLightPrice'),
    ),
    sw(
      'integralLouverLight',
      'תאורה אינטגרלית ברפרפות',
      sel('integralLouverLightTint', 'גוון תאורה', BIO_LIGHTING_TINTS),
      price('integralLouverLightPrice'),
    ),
    sw('insulatedLouvers', 'רפרפות מבודדות', price('insulatedLouversPrice')),
  ]
}
