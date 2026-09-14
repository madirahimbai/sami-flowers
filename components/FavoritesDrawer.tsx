'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { Product, formatPrice } from '@/lib/types';

export default function FavoritesDrawer() {
  const { favorites, toggleFavorite, isFavoritesOpen, closeFavorites, addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFavoritesOpen) return;
    setLoading(true);
    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [isFavoritesOpen]);

  if (!isFavoritesOpen) return null;

  const favProducts = products.filter((p) => favorites.has(p.id));

  return (
    <div className="sheet-overlay open" onClick={(e) => e.target === e.currentTarget && closeFavorites()}>
      <div className="sheet" style={{ maxWidth: 480 }}>
        <button className="sheet-close" type="button" aria-label="Закрыть" onClick={closeFavorites}>
          ×
        </button>
        <div className="cart-body">
          <h3>Избранное</h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
          ) : favProducts.length === 0 ? (
            <div className="cart-empty">
              Пока ничего не добавлено — нажмите на сердечко у товара в каталоге, чтобы сохранить его сюда.
            </div>
          ) : (
            favProducts.map((p) => (
              <div className="cart-item" key={p.id}>
                <Link href={`/product/${p.id}`} onClick={closeFavorites} style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0 }}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--surface-2)', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="ci-name">{p.name}</div>
                    <div className="ci-meta">{formatPrice(p.price)}</div>
                    <button
                      className="ci-remove"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(p.id);
                      }}
                    >
                      Убрать из избранного
                    </button>
                  </div>
                </Link>
                <button
                  className="order-btn"
                  type="button"
                  aria-label="В корзину"
                  onClick={() => {
                    addToCart({ id: p.id, name: p.name, price: p.price, sizeLabel: 'Стандарт', qty: 1, image: p.image });
                    closeFavorites();
                  }}
                >
                  <svg className="icon" style={{ stroke: '#fff8f6', width: 16, height: 16 }} viewBox="0 0 24 24">
                    <path d="M6 6h15l-1.5 9h-12z" />
                    <path d="M6 6L4.5 3H2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
