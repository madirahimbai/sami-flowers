'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Product, formatPrice } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

// A short, honest read of the photo's exact composition ("На фото 25 роз")
// — only shown when the description names a concrete count, never guessed.
function photoCaption(p: Pick<Product, 'name' | 'description'>): string | null {
  const line = (p.description || '').split('\n')[0]?.trim();
  if (!line) return null;
  const m = line.match(/(\d+)\s*(стебл|ветк|шт)/i);
  if (!m) return null;
  const count = m[1];
  const isRoseLine = /роз/i.test(line);
  return isRoseLine ? `На фото ${count} роз` : `На фото ${count} шт`;
}

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addToCart, favorites, toggleFavorite } = useCart();
  const [added, setAdded] = useState(false);
  const availableVariants = product.variants.filter((v) => v.available);
  const [selectedVariant, setSelectedVariant] = useState(availableVariants[0]?.label ?? null);
  const isFav = favorites.has(product.id);
  const caption = photoCaption(product);
  const variant = availableVariants.find((v) => v.label === selectedVariant) ?? null;
  const price = variant ? variant.price : product.price;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.available) return;
    addToCart({
      id: product.id,
      name: product.name,
      price,
      sizeLabel: variant ? variant.label : 'Стандарт',
      qty: 1,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  }

  function selectVariant(e: React.MouseEvent, label: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(label);
  }

  return (
    <Link href={`/product/${product.id}`} className="card">
      <div className="card-art">
        <button
          type="button"
          className={`card-fav ${isFav ? 'is-fav' : ''}`}
          aria-label="В избранное"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
        >
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M12 21s-7-4.35-9.5-8.5C.7 8.9 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5.3 3.9 3.5 7.5C19 16.65 12 21 12 21z" />
          </svg>
        </button>
        {product.tag && <span className="card-tag">{product.tag}</span>}
        {!product.available && <span className="card-tag card-tag-unavailable">Нет в наличии</span>}
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          />
        ) : (
          <svg viewBox="0 0 200 150" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <rect width="200" height="150" fill="var(--surface-2)" />
            <circle cx="100" cy="75" r="26" fill="var(--accent)" />
            <circle cx="75" cy="60" r="18" fill="var(--accent-soft)" />
            <circle cx="125" cy="60" r="18" fill="var(--accent-strong)" opacity="0.85" />
          </svg>
        )}
      </div>
      <div className="card-body">
        {caption && <span className="card-caption">{caption}</span>}
        <h3>{product.name}</h3>
        {availableVariants.length > 0 && (
          <div className="card-variants">
            {availableVariants.map((v) => (
              <button
                key={v.label}
                type="button"
                className={`card-variant-pill ${selectedVariant === v.label ? 'is-active' : ''}`}
                onClick={(e) => selectVariant(e, v.label)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          <button
            className={`card-buy-btn ${added ? 'is-added' : ''}`}
            type="button"
            disabled={!product.available}
            onClick={handleAdd}
          >
            {!product.available ? 'Нет в наличии' : added ? 'Добавлено' : `В корзину · ${formatPrice(price)}`}
          </button>
        </div>
      </div>
    </Link>
  );
}
