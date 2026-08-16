/**
 * Flat map of spec-section values, keyed by stable camelCase field id.
 * Switches/checkboxes store '1' when on, '' when off. Ids of price fields end
 * with 'Price' and feed the item total.
 */
export type SpecValues = Record<string, string>

/** One מפתח row in the folding-glass openings builder. */
export type OpeningRow = {
  id: string
  widthMm: string
  heightMm: string
  /** select products: ימין/שמאל/ימין ושמאל/דלת אמצע; toggle products: 'פתיחת אמצע' or ''; SEEGLASS PRO: always '' */
  opening: string
}

/** Repeatable sub-entry of the מערכת הזזה חשמלית addon. */
export type ElectricSlidingEntry = {
  id: string
  systemNumber: string
  priceIls: string
}

export type ItemAddon = {
  id: string
  name: string
  /** count — informational, not multiplied into totals (priceIls is the line total) */
  qty: string
  priceIls: string
  widthMm: string
  heightMm: string
  lengthM: string
  spotCount: string
  /** select value (גוון מאוורר / מיקום וגוון / סוג הדקורציה) */
  option: string
  /** free-text פירוט התוספת for the 'אחר' addon */
  note: string
  entries: ElectricSlidingEntry[]
}

export type OrderItem = {
  id: string
  product: string
  /** תיאור סעיף זה */
  description: string
  /** multiplies the base price; default '1' */
  quantity: string
  frameColor: string
  lengthCm: string
  projectionCm: string
  heightCm: string
  opening: string
  installationHeightCm: string
  cover: string
  coverColor: string
  finish: string
  priceIls: string
  spec: SpecValues
  openings: OpeningRow[]
  addons: ItemAddon[]
  /** compressed JPEG data-URL of the system's installation location */
  locationImage: string
}

export type PaymentMethod = 'check' | 'cash' | 'transfer' | 'credit'

export type PaymentEntry = {
  id: string
  method: PaymentMethod
  checkNumber: string
  bank: string
  date: string
  amountIls: string
}

export type PaymentMilestone = 'deposit' | 'orderDay' | 'portArrival' | 'installationDay' | 'other'

export type ScheduledPayment = {
  id: string
  percent: string
  amountIls: string
  milestone: PaymentMilestone
  milestoneOther: string
}

export type FormState = {
  orderNumber: string
  orderDate: string
  agentName: string
  customer: {
    mondayItemId: string
    fullName: string
    businessName: string
    idNumber: string
    phone: string
    phone2: string
    email: string
    street: string
    houseNumber: string
    floor: string
    city: string
  }
  items: OrderItem[]
  terms: {
    measurementDays: string
    schedule: ScheduledPayment[]
  }
  payments: PaymentEntry[]
}

let counter = 0
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`

export const emptyItem = (): OrderItem => ({
  id: uid(),
  product: '',
  description: '',
  quantity: '1',
  frameColor: '',
  lengthCm: '',
  projectionCm: '',
  heightCm: '',
  opening: '',
  installationHeightCm: '',
  cover: '',
  coverColor: '',
  finish: '',
  priceIls: '',
  spec: {},
  openings: [],
  addons: [],
  locationImage: '',
})

export const emptyAddon = (name: string): ItemAddon => ({
  id: uid(),
  name,
  qty: '',
  priceIls: '',
  widthMm: '',
  heightMm: '',
  lengthM: '',
  spotCount: '',
  option: '',
  note: '',
  entries: [],
})

export const emptyOpening = (): OpeningRow => ({
  id: uid(),
  widthMm: '',
  heightMm: '',
  opening: '',
})

export const emptyElectricEntry = (): ElectricSlidingEntry => ({
  id: uid(),
  systemNumber: '',
  priceIls: '',
})

export const emptyPayment = (): PaymentEntry => ({
  id: uid(),
  method: 'check',
  checkNumber: '',
  bank: '',
  date: '',
  amountIls: '',
})

export const emptyScheduledPayment = (milestone: PaymentMilestone = 'other'): ScheduledPayment => ({
  id: uid(),
  percent: '',
  amountIls: '',
  milestone,
  milestoneOther: '',
})

/** הסטנדרט: 3 תשלומים — מקדמה, הגעת המערכות לנמל בארץ, יום ההתקנה */
export const defaultSchedule = (): ScheduledPayment[] => [
  emptyScheduledPayment('deposit'),
  emptyScheduledPayment('portArrival'),
  emptyScheduledPayment('installationDay'),
]

export const initialState = (): FormState => ({
  orderNumber: '',
  orderDate: new Date().toISOString().slice(0, 10),
  agentName: '',
  customer: {
    mondayItemId: '',
    fullName: '',
    businessName: '',
    idNumber: '',
    phone: '',
    phone2: '',
    email: '',
    street: '',
    houseNumber: '',
    floor: '',
    city: '',
  },
  items: [emptyItem()],
  terms: {
    measurementDays: '',
    schedule: defaultSchedule(),
  },
  payments: [],
})

export const AGENTS = ['דניאל דור', 'דוד דור']

export const GLASS_CATEGORY = 'מערכות זכוכית'
export const GLASS_ADDON_NAME = 'סגירת מרווחים במעקה זכוכית'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: 'שיק',
  cash: 'מזומן',
  transfer: 'העברה בנקאית',
  credit: 'אשראי',
}

export const MILESTONE_LABELS: Record<PaymentMilestone, string> = {
  deposit: 'מקדמה',
  orderDay: 'יום ההזמנה',
  portArrival: 'הגעת המערכות לנמל בארץ',
  installationDay: 'יום ההתקנה',
  other: 'אחר',
}

export const milestoneText = (p: ScheduledPayment) =>
  p.milestone === 'other' ? p.milestoneOther || 'אחר' : MILESTONE_LABELS[p.milestone]

export const parseAmount = (v: string): number => {
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// itemTotal / itemsTotal live in src/totals.ts — they walk the spec config

export const paymentsTotal = (s: FormState) =>
  s.payments.reduce((sum, p) => sum + parseAmount(p.amountIls), 0)

export const formatIls = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
