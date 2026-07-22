export type OrderItem = {
  id: string
  product: string
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
    installationDays: string
    paymentTerms: string
  }
  payments: PaymentEntry[]
  installationNotes: string
}

let counter = 0
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`

export const emptyItem = (): OrderItem => ({
  id: uid(),
  product: '',
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
})

export const emptyPayment = (): PaymentEntry => ({
  id: uid(),
  method: 'check',
  checkNumber: '',
  bank: '',
  date: '',
  amountIls: '',
})

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
    installationDays: '',
    paymentTerms: '',
  },
  payments: [],
  installationNotes: '',
})

export const AGENTS = ['דניאל דור', 'דוד דור']

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: 'שיק',
  cash: 'מזומן',
  transfer: 'העברה בנקאית',
  credit: 'אשראי',
}

export const parseAmount = (v: string): number => {
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export const itemsTotal = (s: FormState) =>
  s.items.reduce((sum, it) => sum + parseAmount(it.priceIls), 0)

export const paymentsTotal = (s: FormState) =>
  s.payments.reduce((sum, p) => sum + parseAmount(p.amountIls), 0)

export const formatIls = (n: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
