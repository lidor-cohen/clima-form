import { GLASS_ADDON_NAME } from '../types'
import { DECOR_PROFILE_POSITIONS, FAN_TINTS, GLASS_DECOR_TYPES, MOTOR_TYPES } from './catalogs'
import {
  CAT_AWNING,
  CAT_BIO,
  CAT_FIXED,
  CAT_GLASS,
  CAT_PVC,
  CAT_SUNROOM,
  FOLDING_GLASS_BASIC,
  GUILLOTINE,
  MONOBLOC,
  PLEATED_BLIND,
  R95_STONE,
  ROLLER_BLIND,
  ROOF_ZIP,
  SEEGLASS_PRO,
  SEEGLASS_RUN2,
  SEEGLASS_RUN3,
  WINDOW_AWNING,
  WINDOW_AWNING_CASSETTE,
  ZIP_SCREEN,
  isBoraLike,
  resolveProduct,
} from './classify'

/** Addon type lists ported from the docx prototype (per category / product). */

const BASE_ADDONS = [
  'שלט',
  'חיישן גשם',
  'חיישן רוח',
  'משולש אלוקובונד',
  'משולש זכוכית',
  'פחים מכופפים',
  'קורה למאוורר',
  'קורת פילוס',
  'תהומה',
  'מאוורר תקרה',
  'אחר',
]

const PVC_ADDONS = [...BASE_ADDONS, 'צבע לאזור סביבה ימית', 'מותחן']

const BIO_ADDONS = [
  'שלט',
  'חיישן גשם',
  'חיישן רוח',
  'מאוורר תקרה',
  'תהומה',
  'פחים מכופפים',
  'צבע לאזור סביבה ימית',
  'אחר',
]

const FIXED_ADDONS = [
  'שלט',
  'חיישן גשם',
  'חיישן רוח',
  'פחים מכופפים',
  'תהומה',
  'קורת פילוס',
  'משולש אלוקובונד',
  'משולש זכוכית',
  'קורה למאוורר',
  'מאוורר תקרה',
  'צבע לאזור סביבה ימית',
  'ייסוד פנולי',
  'מותחן',
  'אחר',
]

const AWNING_ADDONS = [
  'שלט',
  'חיישן זעזועים',
  'חיישן רוח',
  'חיישן גשם',
  'מנוע',
  'תאורת לד',
  'תאורה אינטגרלית',
  'תהומה',
]

const R95_ADDONS = [
  'שלט',
  'חיישן זעזועים',
  'חיישן רוח',
  'חיישן גשם',
  'מנוע',
  'תאורה אינטגרלית',
  'תהומה',
]

const MONOBLOC_ADDONS = [...AWNING_ADDONS, 'זרוע נוספת ותומך גלילה']

const WINDOW_AWNING_ADDONS = ['שלט', 'חיישן זעזועים', 'חיישן רוח', 'חיישן גשם', 'מנוע', 'תהומה']

const PLEATED_ADDONS = ['שלט', 'חיישן גשם', 'חיישן רוח', 'מנוע']

const ZIP_ADDONS = [
  'שלט',
  'חיישן זעזועים',
  'חיישן רוח',
  'חיישן גשם',
  'מנוע',
  'קורת פילוס',
  'משולש אלוקובונד',
  'משולש זכוכית',
  'תהומה',
  'בד FERRARI',
  'צבע אלומיניום מיוחד',
]

const ROOF_ZIP_ADDONS = [
  'שלט',
  'חיישן זעזועים',
  'חיישן רוח',
  'חיישן גשם',
  'מנוע',
  'תהומה',
  'בד FERRARI',
  'צבע אלומיניום מיוחד',
]

const ROLLER_ADDONS = ZIP_ADDONS.filter((a) => a !== 'בד FERRARI' && a !== 'צבע אלומיניום מיוחד')

// the guide's guillotine addon is the price-only 'מנוע / שלט', not the awning motor
const GUILLOTINE_ADDONS = [
  ...ROLLER_ADDONS.filter((a) => a !== 'מנוע'),
  'צבע לאזור סביבה ימית',
  'פס תאורה',
  'מנוע / שלט',
]

const BORA_ADDONS = [
  'קורת פילוס',
  'משולש אלוקובונד',
  'משולש זכוכית',
  'פס תאורה',
  'צבע לאזור סביבה ימית',
]

const FOLDING_GLASS_ADDONS = [
  'קורת פילוס',
  'משולש אלוקובונד',
  'משולש זכוכית',
  'פרופיל טלסקופי',
  'פרופיל הרחקה',
  'תושבות AUXILIARY למסילה התחתונה',
  'זכוכית קבועה',
]

const RUN_COMMON = ['קורת פילוס', 'משולש אלוקובונד', 'משולש זכוכית', 'זכוכית קבועה']

const RUN3_ADDONS = [
  ...RUN_COMMON,
  'פרופילי חלוקה דקורטיביים',
  'תאורת LED אינטגרלית',
  'מערכת הזזה חשמלית',
]

const RUN2_ADDONS = [...RUN_COMMON, 'דקורציה לזכוכית']

const SUNROOM_ADDONS = [
  'קורת פילוס',
  'משולש אלוקובונד',
  'משולש זכוכית',
  'זכוכית קבועה',
  'תאורת לד אינטגרלית (למטר רץ)',
  'תאורה אינטגרלית EYE ספוט',
]

const SEEGLASS_PRO_ADDONS = ['פרופיל עליון', 'פרופיל לזכוכית נאספת']

const withOther = (types: string[]) => (types.includes('אחר') ? types : [...types, 'אחר'])

/** The addon picker list for a stored product string. */
export function getAddonTypes(productValue: string): string[] | null {
  const resolved = resolveProduct(productValue)
  if (!resolved) return withOther(BASE_ADDONS) // free-text 'אחר' products
  const { category, product: p } = resolved

  if (category === CAT_PVC) return withOther(PVC_ADDONS)
  if (category === CAT_BIO) return withOther(BIO_ADDONS)
  if (category === CAT_FIXED) return withOther(FIXED_ADDONS)
  if (category === CAT_SUNROOM) return withOther(SUNROOM_ADDONS)

  if (category === CAT_AWNING) {
    if (p === PLEATED_BLIND) return withOther(PLEATED_ADDONS)
    if (p === WINDOW_AWNING || p === WINDOW_AWNING_CASSETTE) return withOther(WINDOW_AWNING_ADDONS)
    if (p === ROLLER_BLIND) return withOther(ROLLER_ADDONS)
    if (p === ZIP_SCREEN) return withOther(ZIP_ADDONS)
    if (p === ROOF_ZIP) return withOther(ROOF_ZIP_ADDONS)
    if (p === R95_STONE) return withOther(R95_ADDONS)
    if (p === MONOBLOC) return withOther(MONOBLOC_ADDONS)
    return withOther(AWNING_ADDONS)
  }

  if (category === CAT_GLASS) {
    if (p === SEEGLASS_PRO) return withOther(SEEGLASS_PRO_ADDONS)
    if (p === SEEGLASS_RUN2) return withOther(RUN2_ADDONS)
    if (p === SEEGLASS_RUN3) return withOther(RUN3_ADDONS)
    if (isBoraLike(p)) return withOther(BORA_ADDONS)
    if (p === FOLDING_GLASS_BASIC) return withOther(FOLDING_GLASS_ADDONS)
    if (p === GUILLOTINE) return withOther(GUILLOTINE_ADDONS)
    // SEEGLASS SUB / מעקה זכוכית — base list plus the legacy glass addon
    return withOther([GLASS_ADDON_NAME, ...BASE_ADDONS])
  }

  return withOther(BASE_ADDONS)
}

/** Which extra fields an addon row shows, ported from the docx addAddon(). */
export type AddonShape = {
  count?: { max?: number }
  widthMm?: string
  heightMm?: string
  lengthM?: string
  spotCount?: string
  option?: { label: string; options: string[] }
  note?: boolean
  entries?: boolean
  price: boolean
}

const COUNTABLE = ['קורת פילוס', 'משולש אלוקובונד', 'משולש זכוכית', 'קורה למאוורר', 'מאוורר תקרה', 'מותחן']
const WIDTH_ALSO = ['קורת פילוס', 'משולש אלוקובונד', 'משולש זכוכית', 'קורה למאוורר']
const LENGTH_M = ['תאורת לד', 'תאורה אינטגרלית', 'פס תאורה', 'תאורת LED אינטגרלית', 'תאורת לד אינטגרלית (למטר רץ)']
const WIDTH_PROFILES = ['פרופיל טלסקופי', 'פרופיל הרחקה', 'פרופיל עליון', 'פרופיל לזכוכית נאספת']

export function addonShape(name: string): AddonShape {
  const shape: AddonShape = { price: true }
  if (COUNTABLE.includes(name)) shape.count = name === 'מותחן' ? {} : { max: 3 }
  if (name === GLASS_ADDON_NAME) shape.count = {} // legacy app addon keeps its qty field
  if (name === 'פחים מכופפים') {
    shape.count = {} // guide: כמות + רוחב + מחיר
    shape.widthMm = 'רוחב (מ״מ)'
  } else if (LENGTH_M.includes(name)) shape.lengthM = 'אורך כולל (מטר רץ)'
  else if (name === 'תאורה אינטגרלית EYE ספוט') shape.spotCount = 'מספר ספוטים'
  else if (WIDTH_PROFILES.includes(name)) shape.widthMm = 'רוחב כולל (מ״מ)'
  else if (name === 'זכוכית קבועה') {
    shape.widthMm = 'רוחב (מ״מ)'
    shape.heightMm = 'גובה (מ״מ)'
  } else if (name === 'פרופילי חלוקה דקורטיביים') {
    shape.option = { label: 'מיקום וגוון', options: DECOR_PROFILE_POSITIONS }
  } else if (name === 'דקורציה לזכוכית') {
    shape.option = { label: 'סוג הדקורציה', options: GLASS_DECOR_TYPES }
  } else if (name === 'מערכת הזזה חשמלית') {
    shape.entries = true
    shape.price = false
  } else if (WIDTH_ALSO.includes(name)) {
    shape.widthMm = 'רוחב (מ״מ)'
  }
  if (name === 'מאוורר תקרה') shape.option = { label: 'גוון', options: FAN_TINTS }
  if (name === 'מנוע') shape.option = { label: 'סוג מנוע', options: MOTOR_TYPES }
  if (name === 'אחר') shape.note = true
  return shape
}
