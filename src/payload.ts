import type { FormState, SpecValues } from './types'
import { milestoneText, parseAmount, paymentsTotal, PAYMENT_METHOD_LABELS } from './types'
import { VAT_RATE, itemTotal, itemsTotal, scheduledAmount, totalWithVat, vatAmount } from './totals'
import { describeSpec } from './specs'

/** Raw spec values with empty keys omitted, to keep the JSON small. */
const compactSpec = (spec: SpecValues): SpecValues | null => {
  const entries = Object.entries(spec).filter(([, v]) => v !== '')
  return entries.length > 0 ? Object.fromEntries(entries) : null
}

export function buildPayload(state: FormState, signatureDataUrl: string | null) {
  return {
    meta: {
      source: 'clima-order-form',
      formVersion: 4,
      submittedAt: new Date().toISOString(),
      locale: 'he-IL',
    },
    order: {
      orderNumber: state.orderNumber || null,
      orderDate: state.orderDate || null,
      agentName: state.agentName || null,
    },
    customer: {
      mondayItemId: state.customer.mondayItemId || null,
      // the order update is attached to this row, on whichever board it lives
      mondayBoardId: state.customer.mondayBoardId || null,
      recordType: state.customer.recordType || null,
      fullName: state.customer.fullName,
      businessName: state.customer.businessName || null,
      idNumber: state.customer.idNumber || null,
      phone: state.customer.phone,
      phone2: state.customer.phone2 || null,
      email: state.customer.email || null,
      address: {
        street: state.customer.street || null,
        houseNumber: state.customer.houseNumber || null,
        floor: state.customer.floor || null,
        apartment: state.customer.apartment || null,
        entrance: state.customer.entrance || null,
        city: state.customer.city || null,
      },
    },
    items: state.items.map((it, i) => ({
      line: i + 1,
      product: it.product,
      description: it.description || null,
      quantity: it.quantity ? parseAmount(it.quantity) : 1,
      frameColor: it.frameColor || null,
      dimensionsCm: {
        length: it.lengthCm ? parseAmount(it.lengthCm) : null,
        projection: it.projectionCm ? parseAmount(it.projectionCm) : null,
        height: it.heightCm ? parseAmount(it.heightCm) : null,
        installationHeight: it.installationHeightCm ? parseAmount(it.installationHeightCm) : null,
      },
      opening: it.opening || null,
      cover: it.cover || null,
      coverColor: it.coverColor || null,
      finish: it.finish || null,
      // unit price; lineTotalIls = priceIls × quantity + spec prices + addon prices
      priceIls: it.priceIls ? parseAmount(it.priceIls) : null,
      // raw spec values (ids per src/specs) and label-resolved lines for document rendering
      spec: compactSpec(it.spec),
      specLines: describeSpec(it),
      openings: it.openings
        .filter((o) => o.widthMm || o.heightMm || o.opening)
        .map((o, oi) => ({
          index: oi + 1,
          widthMm: o.widthMm ? parseAmount(o.widthMm) : null,
          heightMm: o.heightMm ? parseAmount(o.heightMm) : null,
          opening: o.opening || null,
        })),
      addons: it.addons.map((a) => ({
        name: a.name,
        // qty is informational; priceIls is the addon's line total
        qty: a.qty ? parseAmount(a.qty) : null,
        widthMm: a.widthMm ? parseAmount(a.widthMm) : null,
        heightMm: a.heightMm ? parseAmount(a.heightMm) : null,
        lengthM: a.lengthM ? parseAmount(a.lengthM) : null,
        spotCount: a.spotCount ? parseAmount(a.spotCount) : null,
        option: a.option || null,
        note: a.note || null,
        priceIls: a.priceIls ? parseAmount(a.priceIls) : null,
        entries: a.entries
          .filter((e) => e.systemNumber || e.priceIls)
          .map((e) => ({
            systemNumber: e.systemNumber ? parseAmount(e.systemNumber) : null,
            priceIls: e.priceIls ? parseAmount(e.priceIls) : null,
          })),
      })),
      lineTotalIls: itemTotal(it) || null,
      locationImage: it.locationImage ? { format: 'image/jpeg', dataUrl: it.locationImage } : null,
    })),
    terms: {
      // supply time, in business days from payment or final measurement (the earlier)
      measurementLeadTimeDays: state.terms.measurementDays ? parseAmount(state.terms.measurementDays) : null,
      paymentSchedule: state.terms.schedule.map((p, i) => ({
        line: i + 1,
        milestone: p.milestone,
        milestoneLabel: milestoneText(p),
        percent: p.percent ? parseAmount(p.percent) : null,
        // amount incl. VAT — derived from the percent when one is set
        amountIls: scheduledAmount(state, p) || null,
      })),
      // legacy free-text field kept so existing webhook mappings still show a summary
      paymentTerms:
        state.terms.schedule
          .map((p, i) => {
            const amount = scheduledAmount(state, p)
            const parts = [p.percent && `${p.percent}%`, amount > 0 && `${amount} ₪`].filter(Boolean).join(', ')
            return `תשלום ${i + 1} — ${milestoneText(p)}${parts ? `: ${parts}` : ''}`
          })
          .join(' | ') || null,
    },
    payments: state.payments.map((p, i) => ({
      line: i + 1,
      method: p.method,
      methodLabel: PAYMENT_METHOD_LABELS[p.method],
      checkNumber: p.checkNumber || null,
      bank: p.bank || null,
      date: p.date || null,
      amountIls: p.amountIls ? parseAmount(p.amountIls) : null,
    })),
    totals: {
      currency: 'ILS',
      itemsTotal: itemsTotal(state),
      vatRate: VAT_RATE,
      vatAmount: vatAmount(state),
      totalWithVat: totalWithVat(state),
      paymentsTotal: paymentsTotal(state),
    },
    signature: signatureDataUrl ? { format: 'image/png', dataUrl: signatureDataUrl } : null,
  }
}

/** Allocate the next sequential order number (server-side counter, starts at 1800). */
export async function fetchOrderNumber(): Promise<string> {
  const res = await fetch('/api/order-number', { method: 'POST' })
  if (!res.ok) throw new Error('לא ניתן להקצות מספר הזמנה — נסו שוב')
  const { orderNumber } = (await res.json()) as { orderNumber: number }
  return String(orderNumber)
}

/**
 * The submission goes through the app server (/api/submit), which forwards it
 * to the n8n webhook. Posting straight from the browser to n8n fails on CORS
 * (Safari shows it as "Load failed").
 */
export async function submitToWebhook(payload: unknown): Promise<void> {
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const { error, upstreamMessage } = (await res.json()) as { error?: string; upstreamMessage?: string }
      if (error) detail = ` — ${error}`
      // the raw n8n message pinpoints the misconfiguration for whoever reads the screenshot
      if (upstreamMessage && !(error ?? '').includes(upstreamMessage)) detail += ` (${upstreamMessage})`
    } catch {
      // no JSON body — keep the status-only message
    }
    // a 404 here is our own /api/submit missing, i.e. the app server is not running
    if (res.status === 404) {
      throw new Error('השליחה נכשלה — שרת האפליקציה אינו זמין (סטטוס 404)')
    }
    throw new Error(`השליחה נכשלה — נסה שוב (סטטוס ${res.status})${detail}`)
  }
}
