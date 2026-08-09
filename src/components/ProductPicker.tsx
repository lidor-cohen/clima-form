import { useState } from 'react'
import type { Category, Product } from '../products'
import { CATEGORIES, VARIANT_SEPARATOR, findSelection, imageUrl } from '../products'

type Props = {
  value: string
  onChange: (v: string) => void
}

function Tile({ label, image, onClick }: { label: string; image?: string; onClick: () => void }) {
  return (
    <button type="button" className={`pp__tile${image ? '' : ' pp__tile--text'}`} onClick={onClick}>
      {image && <img className="pp__tile-img" src={imageUrl(image)} alt="" loading="lazy" />}
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
          {selection.product.image ? (
            <img className="pp__selected-img" src={imageUrl(selection.product.image)} alt="" />
          ) : (
            <span className="pp__selected-img pp__selected-img--empty" aria-hidden>✓</span>
          )}
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
          <img className="pp__variant-img" src={imageUrl(variantProduct.image)} alt={variantProduct.name} />
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
          <Tile label="אחר" onClick={() => setFreeMode(true)} />
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
        <Tile label="אחר" onClick={() => setFreeMode(true)} />
      </div>
    </div>
  )
}
