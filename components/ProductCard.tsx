'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Product, formatPrice } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

const SIZE_CHIPS = [
  { label: 'Стандарт', mult: 1 },
  { label: '1.5х', mult: 1.5 },
  { label: '2х', mult: 2 },
  { label: '3х', mult: 3 },
];

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, favorites, toggleFavorite } = useCart();
  const [mult, setMult] = useState(1);
  const [added, setAdded] = useState(false);
  const isFav = favorites.has(product.id);
  const isBouquet = product.category === 'bouquet';
  const displayPrice = Math.round(product.price * mult);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sizeLabel = isBouquet ? SIZE_CHIPS.find((c) => c.mult === mult)?.label ?? 'Стандарт' : 'Стандарт';
    addToCart({ id: product.id, name: product.name, price: displayPrice, sizeLabel, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
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
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
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
        <h3>{product.name}</h3>
        {isBouquet && (
          <div className="size-chips">
            {SIZE_CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                className={`size-chip ${mult === c.mult ? 'is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMult(c.mult);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="card-foot">
          <span className="price">{formatPrice(displayPrice)}</span>
          <button className={`order-btn ${added ? 'is-added' : ''}`} type="button" aria-label="В корзину" onClick={handleAdd}>
            <svg className="icon" style={{ stroke: '#fff8f6', width: 16, height: 16 }} viewBox="0 0 24 24">
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6L4.5 3H2" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
