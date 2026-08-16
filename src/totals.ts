import type { FormState, OrderItem } from './types'
import { parseAmount } from './types'
import { getSpecFields } from './specs'
import { visiblePriceIds } from './specs/fields'

/** Sum of the visible spec price fields (switch children count only while on). */
export const specTotal = (it: OrderItem): number => {
  const fields = getSpecFields(it.product)
  if (!fields) return 0
  return visiblePriceIds(fields, it.spec).reduce((sum, id) => sum + parseAmount(it.spec[id] ?? ''), 0)
}

const quantityOf = (it: OrderItem): number => {
  const q = Math.round(parseAmount(it.quantity))
  return q > 0 ? q : 1
}

/**
 * basePrice × quantity + spec prices + addon prices.
 * Addon qty is informational — priceIls is the addon's line total (docx semantics).
 */
export const itemTotal = (it: OrderItem): number =>
  parseAmount(it.priceIls) * quantityOf(it) +
  specTotal(it) +
  it.addons.reduce(
    (sum, a) =>
      sum + parseAmount(a.priceIls) + a.entries.reduce((es, e) => es + parseAmount(e.priceIls), 0),
    0,
  )

export const itemsTotal = (s: FormState): number => s.items.reduce((sum, it) => sum + itemTotal(it), 0)
