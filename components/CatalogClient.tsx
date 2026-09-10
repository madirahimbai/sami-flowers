'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';

export default function CatalogClient({ products }: { products: Product[] }) {
  const [panel, setPanel] = useState<'bouquets' | 'gifts'>('bouquets');
  const bouquets = products.filter((p) => p.category === 'bouquet' && p.available);
  const gifts = products.filter((p) => p.category === 'gift' && p.available);
  const list = panel === 'bouquets' ? bouquets : gifts;

  return (
    <section className="section" id="catalog">
      <div className="wrap">
        <div className="section-head">
          <h2>Каталог</h2>
        </div>

        <div className="pill-tabs" role="tablist">
          <button
            className={`pill-tab ${panel === 'bouquets' ? 'is-active' : ''}`}
            onClick={() => setPanel('bouquets')}
          >
            Букеты
          </button>
          <button className={`pill-tab ${panel === 'gifts' ? 'is-active' : ''}`} onClick={() => setPanel('gifts')}>
            Подарки
          </button>
        </div>

        {list.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Пока ничего нет в этом разделе.</p>
        ) : (
          <div className="catalog-grid">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
