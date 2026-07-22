import type { FormState } from './types'
import { itemsTotal, parseAmount, paymentsTotal, PAYMENT_METHOD_LABELS } from './types'

export function buildPayload(state: FormState, signatureDataUrl: string | null) {
  return {
    meta: {
      source: 'urbanica-order-form',
      formVersion: 1,
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
    })),
    terms: {
      measurementLeadTimeDays: state.terms.measurementDays ? parseAmount(state.terms.measurementDays) : null,
      installationLeadTimeDays: state.terms.installationDays ? parseAmount(state.terms.installationDays) : null,
      paymentTerms: state.terms.paymentTerms || null,
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
    installationNotes: state.installationNotes || null,
    signature: signatureDataUrl ? { format: 'image/png', dataUrl: signatureDataUrl } : null,
  }
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
