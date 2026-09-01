import { describe, expect, it } from 'vitest'
import type { FormState, OrderItem } from './types'
import { emptyAddon, emptyItem, initialState } from './types'
import { itemTotal, itemsTotal, totalWithVat, vatAmount, scheduledAmount, VAT_RATE } from './totals'

const model = (product: string, priceIls: string, extra: Partial<OrderItem> = {}): OrderItem => ({
  ...emptyItem(),
  product,
  priceIls,
  ...extra,
})

const withItems = (items: OrderItem[]): FormState => ({ ...initialState(), items })

/** What the UI does when a product is deselected via the picker's שינוי button. */
const clearProduct = (s: FormState, id: string): FormState => ({
  ...s,
  items: s.items.map((row) => (row.id === id ? { ...emptyItem(), id: row.id } : row)),
})

describe('itemsTotal', () => {
  it('removing the middle of three models leaves the sum of the other two', () => {
    const a = model('פרגולה מתכווננת', '1000')
    const b = model('פרגולה נאספת', '2500')
    const c = model('סוכך חלון', '400')
    const state = withItems([a, b, c])
    expect(itemsTotal(state)).toBe(3900)

    const afterRemove = { ...state, items: state.items.filter((it) => it.id !== b.id) }
    expect(afterRemove.items).toHaveLength(2)
    expect(itemsTotal(afterRemove)).toBe(1400)
    expect(itemsTotal(afterRemove)).toBe(itemTotal(a) + itemTotal(c))
  })

  it('deselecting a product drops its price from the total', () => {
    // the reported bug: the price stayed in the total because the pricing block
    // is hidden while the product is empty, so priceIls survived unseen
    const a = model('פרגולה מתכווננת', '1000')
    const b = model('פרגולה נאספת', '2500')
    const state = withItems([a, b])
    expect(itemsTotal(state)).toBe(3500)

    const cleared = clearProduct(state, b.id)
    expect(cleared.items).toHaveLength(2)
    expect(itemsTotal(cleared)).toBe(1000)
  })

  it('an item carrying a price but no product contributes nothing', () => {
    // belt and braces: even if a stale price survives, it cannot be billed
    const orphan = { ...emptyItem(), product: '', priceIls: '9999' }
    expect(itemTotal(orphan)).toBe(0)
    expect(itemsTotal(withItems([model('סוכך חלון', '400'), orphan]))).toBe(400)
  })

  it('an empty order totals zero', () => {
    expect(itemsTotal(withItems([emptyItem()]))).toBe(0)
  })
})

describe('itemTotal', () => {
  it('multiplies the base price by quantity', () => {
    expect(itemTotal(model('סוכך חלון', '400', { quantity: '3' }))).toBe(1200)
  })

  it('treats a missing or zero quantity as one', () => {
    expect(itemTotal(model('סוכך חלון', '400', { quantity: '' }))).toBe(400)
    expect(itemTotal(model('סוכך חלון', '400', { quantity: '0' }))).toBe(400)
  })

  it('adds addon prices and their sub-entries', () => {
    const item = model('סוכך חלון', '400', {
      addons: [
        {
          ...emptyAddon('שלט'),
          qty: '1',
          priceIls: '250',
          entries: [{ id: 'e1', systemNumber: '1', priceIls: '300' }],
        },
      ],
    })
    expect(itemTotal(item)).toBe(400 + 250 + 300)
  })
})

describe('derived money lines follow the item total', () => {
  it('VAT and the grand total drop when a model is removed', () => {
    const a = model('פרגולה מתכווננת', '1000')
    const b = model('פרגולה נאספת', '1000')
    const state = withItems([a, b])
    expect(vatAmount(state)).toBe(Math.round(2000 * VAT_RATE))
    expect(totalWithVat(state)).toBe(2000 + Math.round(2000 * VAT_RATE))

    const afterRemove = { ...state, items: [a] }
    expect(vatAmount(afterRemove)).toBe(Math.round(1000 * VAT_RATE))
    expect(totalWithVat(afterRemove)).toBe(1000 + Math.round(1000 * VAT_RATE))
  })

  it('a percentage payment is recomputed from the current total', () => {
    const a = model('פרגולה מתכווננת', '1000')
    const b = model('פרגולה נאספת', '1000')
    const state = withItems([a, b])
    const deposit = { ...state.terms.schedule[0], percent: '50', percentChoice: '50' }

    expect(scheduledAmount(state, deposit)).toBe(Math.round(totalWithVat(state) / 2))
    const afterRemove = { ...state, items: [a] }
    expect(scheduledAmount(afterRemove, deposit)).toBe(Math.round(totalWithVat(afterRemove) / 2))
  })
})
