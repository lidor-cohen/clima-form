export type Product = {
  name: string
  /** file name inside public/product-images (kept exactly as on disk, typos included) */
  image?: string
  /** extra choice appended to the product name, e.g. roller blind ידני/חשמלי */
  variants?: string[]
}

export type Category = {
  name: string
  image?: string
  products: Product[]
}

export const VARIANT_SEPARATOR = ' – '

export const CATEGORIES: Category[] = [
  {
    name: 'פרגולות PVC נאספות',
    image: 'פרגולות PVC נאספות.jpeg',
    products: [
      { name: 'פרגולת PVC שיפועית', image: 'פרגולת PVC  שיפועית.jpeg' },
      { name: 'פרגולת PVC שיפועית עצמאית', image: 'פרגולת PVC שיפועית עצמאית.jpeg' },
      { name: 'פרגולת PVC תלויה', image: 'פרגולת PVC תלויה.jpeg' },
      { name: 'פרגולת PVC מפולסת', image: 'פרגולת PVC מפולסת.jpeg' },
    ],
  },
  {
    name: 'פרגולות ביואקלימיות',
    image: 'פרגולות ביואקלימיות.jpeg',
    products: [
      { name: 'פרגולה מתכווננת' },
      { name: 'פרגולה נאספת' },
      { name: 'פרגולה משולבת – מתכווננת ונאספת' },
    ],
  },
  {
    name: 'פרגולות קבועות',
    image: 'פרגולות קבועות.jpeg',
    products: [
      { name: 'פרגולה קבועה' },
      { name: 'קונסטרוקציה שיפועית עם BH', image: 'קונסטרוקצייה שיפועית עם BH.jpeg' },
      { name: 'פרגולה קבועה תלויה', image: 'פרגולה קבועה תלויה.jpeg' },
      { name: 'מערכת איזי גלייז', image: 'מערכת איזי גלייז.jpeg' },
    ],
  },
  {
    name: 'סוככים ומערכות הצללה',
    image: 'סוככים ומערכות הצללה.jpeg',
    products: [
      { name: 'סוכך זרועות MONOBLOC 350', image: 'סוכך זרועות MONOCLOC 350.jpeg' },
      { name: 'סוכך קסטה STORBOX S-300', image: 'STORBOX S- 300.jpeg' },
      { name: 'סוכך קסטה STORBOX 400', image: 'STORBOX 400.jpeg' },
      { name: 'סוכך קסטה R95 STONE', image: 'R 95 STONE.jpeg' },
      { name: 'סוכך מסך ZIP', image: 'סוכך מסך ZIP.jpeg' },
      { name: 'מערכת הצללה לגג ROOF ZIP', image: 'Roof Zip.jpeg' },
      { name: 'סוכך חלון', image: 'סוכך חלון.jpeg' },
      { name: 'סוכך חלון עם קסטה', image: 'סוכך חלון קסטה.jpeg' },
      { name: 'וילון גלילה ROLLER BLIND', image: 'וילון גלילה ROLLER BLIND.jpeg', variants: ['ידני', 'חשמלי'] },
      { name: 'וילון פליסה PLEATED BLIND', image: 'וילון פליסה.jpeg' },
    ],
  },
  {
    name: 'מערכות זכוכית',
    image: 'מערכות זכוכית.jpeg',
    products: [
      { name: 'גיליוטינה חשמלית', image: 'גליוטינה חשמלית.jpeg' },
      { name: 'זכוכית נאספת', image: 'זכוכית נאספת.jpeg' },
      { name: 'SEEGLASS RUN 3', image: 'run 3.jpeg' },
      { name: 'SEEGLASS SUB' },
      { name: 'SEEGLASS RUN 2', image: 'run 2.jpeg' },
      { name: 'BORA', image: 'bora.jpeg' },
      { name: 'מערכת הזזה פרופיל 9000', image: '9000.jpeg' },
      { name: 'מערכת הזזה פרופיל 7000', image: '7000.jpeg' },
      { name: 'מערכת הזזה 9200', image: '9200.jpeg' },
      { name: 'דלת זכוכית', image: 'דלת זכוכית.jpeg' },
      { name: 'מעקה זכוכית SEEGLASS PRO', image: 'seeglass pro.jpeg' },
      { name: 'מעקה זכוכית', image: 'מעקה זכוכית.jpeg' },
    ],
  },
  {
    name: 'חדרי שמש',
    image: 'חדרי שמש.jpeg',
    products: [
      { name: 'גג זכוכית קבוע', image: 'גג זכוכית קבוע.jpeg' },
      { name: 'גג זכוכית נפתח', image: 'גג זכוכית נפתח.jpeg' },
    ],
  },
]

export const imageUrl = (file: string) => encodeURI(`/product-images/${file}`)

export type Selection = {
  category: Category
  product: Product
  variant?: string
}

/** Resolve a stored product string back to catalog entries (handles variant suffixes). */
export function findSelection(value: string): Selection | null {
  const v = value.trim()
  if (!v) return null
  for (const category of CATEGORIES) {
    for (const product of category.products) {
      if (product.name === v) return { category, product }
      if (product.variants) {
        for (const variant of product.variants) {
          if (v === `${product.name}${VARIANT_SEPARATOR}${variant}`) {
            return { category, product, variant }
          }
        }
      }
    }
  }
  return null
}
