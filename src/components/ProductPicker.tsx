import { useState } from 'react'
import type { Category, Product } from '../products'
import { CATEGORIES, VARIANT_SEPARATOR, findSelection, imageUrl } from '../products'

type Props = {
  value: string
  onChange: (v: string) => void
}

/**
 * Stands in for a catalogue photo that does not exist, or one whose file fails
 * to load. Keeps the 4:3 footprint of a real tile so the grid stays even
 * instead of collapsing to a short text box next to full-height photos.
 */
function ImagePlaceholder({ className }: { className: string }) {
  return (
    <span className={`${className} ${className}--placeholder`} aria-hidden>
      <svg viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <circle cx="10" cy="9" r="2.5" fill="currentColor" opacity="0.45" />
        <path d="M4 19l7-7 5 5 4-3 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
      </svg>
    </span>
  )
}

/** An <img> that falls back to the placeholder when the file cannot be loaded. */
function TileImage({ className, file, alt = '' }: { className: string; file?: string; alt?: string }) {
  const [failed, setFailed] = useState(false)
  if (!file || failed) return <ImagePlaceholder className={className} />
  return (
    <img
      className={className}
      src={imageUrl(file)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function Tile({
  label,
  image,
  textOnly,
  onClick,
}: {
  label: string
  image?: string
  textOnly?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={`pp__tile${textOnly ? ' pp__tile--text' : ''}`} onClick={onClick}>
      {!textOnly && <TileImage className="pp__tile-img" file={image} />}
      <span className="pp__tile-label">{label}</span>
    </button>
  )
}

export function ProductPicker({ value, onChange }: Props) {
  const selection = findSelection(value)
  const [category, setCategory] = useState<Category | null>(null)
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)
  const [freeMode, setFreeMode] = useState(false)

  const reset = () => {
    setCategory(null)
    setVariantProduct(null)
    setFreeMode(false)
  }

  const clear = () => {
    onChange('')
    reset()
  }

  // A value that isn't in the catalog is a free-text product ("אחר")
  const isFree = freeMode || (value.trim() !== '' && !selection)

  if (selection) {
    return (
      <div className="pp">
        <div className="pp__selected">
          <TileImage className="pp__selected-img" file={selection.product.image} />
          <span className="pp__selected-info">
            <span className="pp__crumb">{selection.category.name}</span>
            <strong>
              {selection.product.name}
              {selection.variant ? `${VARIANT_SEPARATOR}${selection.variant}` : ''}
            </strong>
          </span>
          <button type="button" className="btn btn--ghost" onClick={clear}>
            שינוי
          </button>
        </div>
      </div>
    )
  }

  if (isFree) {
    return (
      <div className="pp">
        <div className="pp__head">
          <button type="button" className="pp__back" onClick={clear}>
            ‹ חזרה לרשימת המוצרים
          </button>
        </div>
        <input
          className="input"
          type="text"
          value={value}
          placeholder="תיאור המוצר במילים שלכם"
          autoFocus
          onChange={(e) => {
            setFreeMode(true)
            onChange(e.target.value)
          }}
        />
      </div>
    )
  }

  if (variantProduct) {
    return (
      <div className="pp">
        <div className="pp__head">
          <button type="button" className="pp__back" onClick={() => setVariantProduct(null)}>
            ‹ {variantProduct.name}
          </button>
        </div>
        {variantProduct.image && (
          <TileImage className="pp__variant-img" file={variantProduct.image} alt={variantProduct.name} />
        )}
        <p className="pp__hint">בחירת סוג הפעלה:</p>
        <div className="pp__variants">
          {variantProduct.variants!.map((variant) => (
            <button
              key={variant}
              type="button"
              className="btn btn--outline"
              onClick={() => {
                onChange(`${variantProduct.name}${VARIANT_SEPARATOR}${variant}`)
                reset()
              }}
            >
              {variant}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (category) {
    return (
      <div className="pp">
        <div className="pp__head">
          <button type="button" className="pp__back" onClick={() => setCategory(null)}>
            ‹ כל הקטגוריות
          </button>
          <span className="pp__crumb">{category.name}</span>
        </div>
        <div className="pp__grid">
          {category.products.map((product) => (
            <Tile
              key={product.name}
              label={product.name}
              image={product.image}
              onClick={() => {
                if (product.variants?.length) {
                  setVariantProduct(product)
                } else {
                  onChange(product.name)
                  reset()
                }
              }}
            />
          ))}
          <Tile label="אחר" textOnly onClick={() => setFreeMode(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="pp">
      <p className="pp__hint">באיזו קטגוריה מדובר?</p>
      <div className="pp__grid">
        {CATEGORIES.map((cat) => (
          <Tile key={cat.name} label={cat.name} image={cat.image} onClick={() => setCategory(cat)} />
        ))}
        <Tile label="אחר" textOnly onClick={() => setFreeMode(true)} />
      </div>
    </div>
  )
}
