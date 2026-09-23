'use client';

import { useMemo, useState } from 'react';
import { Product, Category, formatPrice } from '@/lib/types';
import { CATALOG_COLORS, productColors } from '@/lib/catalog';
import ProductCard from './ProductCard';

type SortId = 'default' | 'price_asc' | 'price_desc' | 'new' | 'popular';

export default function CatalogClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [panel, setPanel] = useState<'bouquets' | 'gifts'>('bouquets');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortId>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [priceMax, setPriceMax] = useState<number | null>(null);

  const bouquets = useMemo(() => products.filter((p) => p.category === 'bouquet'), [products]);
  const gifts = useMemo(() => products.filter((p) => p.category === 'gift' && p.available), [products]);

  // "Популярные" only makes sense once real order data exists — with none
  // yet, offering a sort that would silently do nothing (or worse, sort by
  // insertion order pretending it's popularity) is worse than not offering
  // it at all.
  const hasPopularityData = useMemo(() => bouquets.some((p) => (p.order_count ?? 0) > 0), [bouquets]);

  const priceBounds = useMemo(() => {
    const prices = bouquets.map((p) => p.price);
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [bouquets]);

  const visibleCategoryTabs = useMemo(
    () => categories.filter((c) => bouquets.some((p) => p.available && p.category_tags?.includes(c.id))),
    [bouquets, categories]
  );

  const filtered = useMemo(() => {
    let list = bouquets;
    if (onlyAvailable) list = list.filter((p) => p.available);
    if (activeFilter !== 'all') list = list.filter((p) => p.category_tags?.includes(activeFilter));
    if (selectedColors.size > 0) list = list.filter((p) => productColors(p).some((c) => selectedColors.has(c)));
    if (priceMax !== null) list = list.filter((p) => p.price <= priceMax);

    const sorted = [...list];
    if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'new') sorted.sort((a, b) => (b.id > a.id ? 1 : -1)); // newer rows sort later in id order
    else if (sort === 'popular') sorted.sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0));
    return sorted;
  }, [bouquets, onlyAvailable, activeFilter, selectedColors, priceMax, sort]);

  const list = panel === 'bouquets' ? filtered : gifts;
  const activeFilterCount = (selectedColors.size > 0 ? 1 : 0) + (priceMax !== null ? 1 : 0) + (onlyAvailable ? 0 : 1);

  function toggleColor(id: string) {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="section" id="catalog" style={{ paddingTop: 24 }}>
      <div className="wrap">
        <div className="section-head">
          <h1>Каталог</h1>
        </div>

        {gifts.length > 0 && (
          <div className="pill-tabs" role="tablist" style={{ marginBottom: 14 }}>
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
        )}

        {panel === 'bouquets' && (
          <div className="catalog-toolbar">
            <div className="pill-tabs" role="tablist">
              <button
                className={`pill-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Все букеты
              </button>
              {visibleCategoryTabs.map((c) => (
                <button
                  key={c.id}
                  className={`pill-tab ${activeFilter === c.id ? 'is-active' : ''}`}
                  onClick={() => setActiveFilter(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="catalog-toolbar-actions">
              <button type="button" className="filters-btn" onClick={() => setFiltersOpen(true)}>
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
                Фильтры{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
              </button>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortId)}>
                <option value="default">По умолчанию</option>
                <option value="new">Сначала новые</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
                {hasPopularityData && <option value="popular">Популярные</option>}
              </select>
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            {panel === 'gifts' ? 'Пока ничего нет в этом разделе.' : 'Ничего не нашлось под эти фильтры.'}
          </p>
        ) : (
          <div className="catalog-grid">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="sheet-overlay open" onClick={(e) => e.target === e.currentTarget && setFiltersOpen(false)}>
          <div className="sheet" style={{ maxWidth: 420 }}>
            <button className="sheet-close" type="button" aria-label="Закрыть" onClick={() => setFiltersOpen(false)}>
              ×
            </button>
            <div className="cart-body">
              <h3>Фильтры</h3>

              <span className="field-label">Наличие</span>
              <label className="filter-check">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                Только в наличии
              </label>

              {CATALOG_COLORS.length > 0 && (
                <>
                  <span className="field-label">Цвет</span>
                  <div className="color-row">
                    {CATALOG_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`color-swatch ${selectedColors.has(c.id) ? 'is-active' : ''}`}
                        onClick={() => toggleColor(c.id)}
                      >
                        <span className="color-dot" style={{ background: c.hex }} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <span className="field-label">Цена, до {formatPrice(priceMax ?? priceBounds.max)}</span>
              <input
                type="range"
                className="price-range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={500}
                value={priceMax ?? priceBounds.max}
                onChange={(e) => setPriceMax(Number(e.target.value))}
              />

              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}
                onClick={() => {
                  setOnlyAvailable(true);
                  setSelectedColors(new Set());
                  setPriceMax(null);
                }}
              >
                Сбросить фильтры
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                onClick={() => setFiltersOpen(false)}
              >
                Показать {filtered.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
