import type { FormState } from './types'
import { itemTotal, itemsTotal, milestoneText, parseAmount, paymentsTotal, PAYMENT_METHOD_LABELS } from './types'

export function buildPayload(state: FormState, signatureDataUrl: string | null) {
  return {
    meta: {
      source: 'clima-order-form',
      formVersion: 2,
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
        city: state.customer.city || null,
      },
    },
    items: state.items.map((it, i) => ({
      line: i + 1,
      product: it.product,
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
      priceIls: it.priceIls ? parseAmount(it.priceIls) : null,
      addons: it.addons.map((a) => ({
        name: a.name,
        qty: a.qty ? parseAmount(a.qty) : null,
        priceIls: a.priceIls ? parseAmount(a.priceIls) : null,
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
        amountIls: p.amountIls ? parseAmount(p.amountIls) : null,
      })),
      // legacy free-text field kept so existing webhook mappings still show a summary
      paymentTerms:
        state.terms.schedule
          .map((p, i) => {
            const parts = [p.percent && `${p.percent}%`, p.amountIls && `${p.amountIls} ₪`].filter(Boolean).join(', ')
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

async function getWebhookUrl(): Promise<string | undefined> {
  try {
    const res = await fetch('/api/config')
    if (res.ok) {
      const { webhookUrl } = (await res.json()) as { webhookUrl: string | null }
      if (webhookUrl) return webhookUrl
    }
  } catch {
    // fall through to the build-time value
  }
  return import.meta.env.VITE_WEBHOOK_URL as string | undefined
}

export async function submitToWebhook(payload: unknown): Promise<void> {
  const url = await getWebhookUrl()
  if (!url) {
    throw new Error('כתובת ה-Webhook אינה מוגדרת (VITE_WEBHOOK_URL בקובץ ‎.env)')
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(`השליחה נכשלה (סטטוס ${res.status})`)
  }
}
