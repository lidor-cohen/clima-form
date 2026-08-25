import { findSelection } from '../products'
import type { Selection } from '../products'

/**
 * Product-family predicates ported from the docx prototype (renderAwningSpec).
 * All predicates take the BASE product name — the stored product string may
 * carry a variant suffix (e.g. 'וילון גלילה ROLLER BLIND – ידני'), so resolve
 * through resolveProduct() first.
 */

export const CAT_PVC = 'פרגולות PVC נאספות'
export const CAT_BIO = 'פרגולות ביואקלימיות'
export const CAT_FIXED = 'פרגולות קבועות'
export const CAT_AWNING = 'סוככים ומערכות הצללה'
export const CAT_GLASS = 'מערכות זכוכית'
export const CAT_SUNROOM = 'חדרי שמש'

export const BORA_LIKE = [
  'BORA',
  'מערכת הזזה פרופיל 9000',
  'מערכת הזזה פרופיל 7000',
  'מערכת הזזה 9200',
  'דלת זכוכית',
]

export const SUNROOM_PRODUCTS = ['גג זכוכית קבוע', 'גג זכוכית נפתח']

export const RUN2_LIKE = ['SEEGLASS RUN 2', ...SUNROOM_PRODUCTS]

export const FOLDING_GLASS = [
  ...BORA_LIKE,
  'זכוכית נאספת',
  'SEEGLASS RUN 3',
  'SEEGLASS RUN 2',
  'מעקה זכוכית SEEGLASS PRO',
  'מעקה זכוכית',
  ...SUNROOM_PRODUCTS,
]

/** Products whose aluminum color comes from the stock finishes list. */
export const STOCK_FINISH_PRODUCTS = [
  'זכוכית נאספת',
  'SEEGLASS RUN 3',
  'SEEGLASS RUN 2',
  'גג זכוכית קבוע',
  'גג זכוכית נפתח',
  'מעקה זכוכית SEEGLASS PRO',
  'מעקה זכוכית',
  'SEEGLASS SUB',
  'גיליוטינה חשמלית',
]

export const ROLLER_BLIND = 'וילון גלילה ROLLER BLIND'
export const PLEATED_BLIND = 'וילון פליסה PLEATED BLIND'
export const GUILLOTINE = 'גיליוטינה חשמלית'
export const SEEGLASS_PRO = 'מעקה זכוכית SEEGLASS PRO'
export const GLASS_RAILING = 'מעקה זכוכית'
export const SEEGLASS_SUB = 'SEEGLASS SUB'
export const SEEGLASS_RUN3 = 'SEEGLASS RUN 3'
export const SEEGLASS_RUN2 = 'SEEGLASS RUN 2'
export const FOLDING_GLASS_BASIC = 'זכוכית נאספת'
export const GLASS_DOOR = 'דלת זכוכית'
export const MONOBLOC = 'סוכך זרועות MONOBLOC 350'
export const STORBOX_S300 = 'סוכך קסטה STORBOX S-300'
export const STORBOX_400 = 'סוכך קסטה STORBOX 400'
export const WINDOW_AWNING = 'סוכך חלון'
export const WINDOW_AWNING_CASSETTE = 'סוכך חלון עם קסטה'
export const ZIP_SCREEN = 'סוכך מסך ZIP'
export const ROOF_ZIP = 'מערכת הצללה לגג ROOF ZIP'
export const R95_STONE = 'סוכך קסטה R95 STONE'
export const FIXED_PERGOLA = 'פרגולה קבועה'
export const EASY_GLAZE = 'מערכת איזי גלייז'
export const PVC_LEVELED = 'פרגולת PVC מפולסת'
export const FIXED_GLASS_ROOF = 'גג זכוכית קבוע'
export const OPENING_GLASS_ROOF = 'גג זכוכית נפתח'

export const isBoraLike = (p: string) => BORA_LIKE.includes(p)
export const isRailing = (p: string) => p === SEEGLASS_PRO || p === GLASS_RAILING
export const isSunroom = (p: string) => SUNROOM_PRODUCTS.includes(p)
export const isRun2Like = (p: string) => RUN2_LIKE.includes(p)
export const isFoldingGlass = (p: string) => FOLDING_GLASS.includes(p)
export const usesStockFinishes = (p: string) => STOCK_FINISH_PRODUCTS.includes(p)
export const isZipLike = (p: string) =>
  p === ZIP_SCREEN || p === GUILLOTINE || isBoraLike(p) || isFoldingGlass(p) || p === ROLLER_BLIND

export type ResolvedProduct = {
  category: string
  /** base product name, without the variant suffix */
  product: string
  variant?: string
}

/** Resolve the stored product string to category + base name (null for free text). */
export function resolveProduct(value: string): ResolvedProduct | null {
  const s: Selection | null = findSelection(value)
  if (!s) return null
  return { category: s.category.name, product: s.product.name, variant: s.variant }
}
