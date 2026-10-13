import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CATEGORIES, imageUrl } from './products'

const IMAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'product-images')

/**
 * Catalogue entries that have no photo yet. The client has been asked to supply
 * these five; until they arrive the picker renders a placeholder tile.
 *
 * Do not add to this list to make a failure go away — a new entry here means a
 * model shipped without an image. Remove a line as soon as its photo lands.
 */
const KNOWN_MISSING_IMAGES = [
  'פרגולות ביואקלימיות / פרגולה מתכווננת',
  'פרגולות ביואקלימיות / פרגולה נאספת',
  'פרגולות ביואקלימיות / פרגולה משולבת – מתכווננת ונאספת',
  'פרגולות קבועות / פרגולה קבועה',
  'מערכות זכוכית / SEEGLASS SUB',
]

type Entry = { label: string; image?: string }

const entries: Entry[] = CATEGORIES.flatMap((category) => [
  { label: category.name, image: category.image },
  ...category.products.map((product) => ({
    label: `${category.name} / ${product.name}`,
    image: product.image,
  })),
])

const referenced = entries.filter((e): e is Required<Entry> => Boolean(e.image))

describe('product catalogue images', () => {
  it('has entries to check', () => {
    expect(entries.length).toBeGreaterThan(30)
    expect(referenced.length).toBeGreaterThan(30)
  })

  it.each(referenced.map((e) => [e.label, e.image] as const))(
    'every referenced image exists on disk: %s',
    (_label, image) => {
      expect(existsSync(join(IMAGE_DIR, image))).toBe(true)
    },
  )

  it('has no catalogue entry missing an image beyond the known gaps', () => {
    const missing = entries.filter((e) => !e.image).map((e) => e.label)
    // sorted comparison so the diff on failure names the offending model
    expect([...missing].sort()).toEqual([...KNOWN_MISSING_IMAGES].sort())
  })

  it('encodes image URLs so Hebrew names and spaces survive the request', () => {
    expect(imageUrl('פרגולת PVC  שיפועית.jpeg')).toBe(
      encodeURI('/product-images/פרגולת PVC  שיפועית.jpeg'),
    )
    expect(imageUrl('R 95 STONE.jpeg')).toContain('%20')
  })

  it('never references the same photo from two different products', () => {
    const productImages = CATEGORIES.flatMap((c) => c.products.map((p) => p.image).filter(Boolean))
    expect(new Set(productImages).size).toBe(productImages.length)
  })
})

import { BUILT_IN_TERMS_TEXT, termsLines } from './terms'

describe('terms text', () => {
  it('splits the editable text into trimmed non-empty lines', () => {
    expect(termsLines('  א \n\n\r\nב  \n')).toEqual(['א', 'ב'])
  })
  it('built-in text carries every default note', () => {
    expect(termsLines(BUILT_IN_TERMS_TEXT)).toHaveLength(4)
  })
})
