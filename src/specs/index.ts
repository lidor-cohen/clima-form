import type { OrderItem } from '../types'
import type { SpecField, SpecLine } from './fields'
import { describeFields, specDefaults } from './fields'
import { awningGlassSpec, hasOpenings as hasOpeningsFor, openingControlFor } from './awningGlass'
import type { OpeningControl } from './awningGlass'
import { bioSpec } from './bio'
import { fixedSpec } from './fixed'
import { pvcSpec } from './pvc'
import {
  CAT_AWNING,
  CAT_BIO,
  CAT_FIXED,
  CAT_GLASS,
  CAT_PVC,
  CAT_SUNROOM,
  resolveProduct,
} from './classify'

export { getAddonTypes, addonShape } from './addons'
export type { AddonShape } from './addons'
export type { OpeningControl } from './awningGlass'
export type { SpecField, SpecLine } from './fields'

/** The spec-section fields for a stored product string, or null for the legacy generic form. */
export function getSpecFields(productValue: string): SpecField[] | null {
  const resolved = resolveProduct(productValue)
  if (!resolved) return null
  const { category, product } = resolved
  if (category === CAT_PVC) return pvcSpec(product)
  if (category === CAT_BIO) return bioSpec()
  if (category === CAT_FIXED) return fixedSpec(product)
  if (category === CAT_AWNING || category === CAT_SUNROOM || category === CAT_GLASS) {
    return awningGlassSpec(product)
  }
  return null
}

/** Whether the product uses the openings (מפתחים) builder, and which control. */
export function openingsFor(productValue: string): OpeningControl | null {
  const resolved = resolveProduct(productValue)
  if (!resolved) return null
  const { category, product } = resolved
  if (category !== CAT_GLASS && category !== CAT_AWNING) return null
  if (!hasOpeningsFor(product)) return null
  return openingControlFor(product)
}

/** Initial spec values on product (re)selection: config defaults + roller variant seed. */
export function initialSpecValues(productValue: string): Record<string, string> {
  const fields = getSpecFields(productValue)
  if (!fields) return {}
  const values = specDefaults(fields)
  const resolved = resolveProduct(productValue)
  if (resolved?.variant) values.operation = resolved.variant
  return values
}

/** Legible label/value lines of the filled spec — for the review page and payload. */
export function describeSpec(it: OrderItem): SpecLine[] {
  const fields = getSpecFields(it.product)
  if (!fields) return []
  const lines = describeFields(fields, it.spec)
  // the pleated fabric marker component writes these two ids directly
  const pleatedType = it.spec.pleatedFabricType
  const pleatedColor = it.spec.pleatedFabricColor
  if (pleatedType) lines.push({ id: 'pleatedFabricType', label: 'סוג הבד', value: pleatedType })
  if (pleatedColor) lines.push({ id: 'pleatedFabricColor', label: 'צבע הבד', value: pleatedColor })
  return lines
}
