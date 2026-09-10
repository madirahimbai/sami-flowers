'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Product, formatPrice } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

const SIZE_CHIPS = [
  { label: 'S', mult: 0.7 },
  { label: 'M', mult: 1 },
  { label: 'L', mult: 1.5 },
];

const FLOWER_COLORS = [
  { name: 'Розовый', hex: '#e39fb4' },
  { name: 'Белый', hex: '#f6f2ea' },
  { name: 'Красный', hex: '#c23b4a' },
  { name: 'Жёлтый', hex: '#e8c14a' },
  { name: 'Сиреневый', hex: '#b79bd1' },
];

const WRAP_COLORS = [
  { name: 'Крафт', hex: '#b98a5e' },
  { name: 'Белый', hex: '#f6f2ea' },
  { name: 'Розовый', hex: '#f0c9d3' },
  { name: 'Чёрный', hex: '#2b2320' },
];

export default function ProductPageClient({ product, related }: { product: Product; related: Product[] }) {
  const { addToCart, openCart } = useCart();
  const [mult, setMult] = useState(1);
  const [flowerColor, setFlowerColor] = useState(FLOWER_COLORS[0].name);
  const [wrapColor, setWrapColor] = useState(WRAP_COLORS[0].name);
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = product.image ? [product.image] : [];
  const unitPrice = Math.round(product.price * mult);
  const total = unitPrice * qty;
  const sizeLabel = SIZE_CHIPS.find((c) => c.mult === mult)?.label ?? 'M';

  function handleAdd() {
    addToCart({
      id: product.id,
      name: product.name,
      price: unitPrice,
      sizeLabel: `${sizeLabel} · ${flowerColor} · упаковка ${wrapColor}`,
      qty,
    });
    openCart();
  }

  return (
    <div className="pp-page" style={{ position: 'static' }}>
      <div className="pp-topbar wrap">
        <Link className="pp-back" href="/">
          <svg className="icon" style={{ width: 15, height: 15 }} viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Назад к каталогу
        </Link>
      </div>

      <div className="pp-body wrap">
        <div className="pp-grid">
          <div className="pp-gallery">
            {images.length > 1 && (
              <div className="pp-thumbs">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <button key={i} className="pp-thumb is-active" type="button">
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="pp-main">
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="pp-main-img"
                  src={images[0]}
                  alt={product.name}
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%' }}>
                  <rect width="200" height="150" fill="var(--surface-2)" />
                  <circle cx="100" cy="75" r="26" fill="var(--accent)" />
                </svg>
              )}
              {images[0] && (
                <button className="pp-zoom-btn" type="button" aria-label="На весь экран" onClick={() => setLightboxOpen(true)}>
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M9 3H3v6M15 3h6v6M21 15v6h-6M3 15v6h6" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="pp-info">
            {product.tag && <span className="card-tag" style={{ display: 'inline-flex', position: 'static' }}>{product.tag}</span>}
            <h1>{product.name}</h1>
            <p className="pp-lede">{product.description || 'Свежий букет ручной сборки от Sami Flowers.'}</p>
            <div className="pp-price">{formatPrice(total)}</div>

            <div className="pp-availability">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              В наличии сейчас · доставка от 90 минут по Павлодару
            </div>

            <div className="pp-section">
              <h4>Состав</h4>
              <p>{product.description || 'Состав уточняйте у флориста — сезонный набор цветов может отличаться.'}</p>
            </div>

            <div className="pp-section">
              <h4>Размеры готового букета</h4>
              <p className="pp-demo-note">
                Высота и диаметр уточним при сборке букета — зависят от сезонной формы цветов (демонстрационное
                поле).
              </p>
            </div>

            <div className="pp-section">
              <h4>Размер букета</h4>
              <div className="size-chips">
                {SIZE_CHIPS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    className={`size-chip ${mult === c.mult ? 'is-active' : ''}`}
                    onClick={() => setMult(c.mult)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-section">
              <h4>
                Цвет цветов <span className="pp-demo-tag">демо</span>
              </h4>
              <div className="color-row">
                {FLOWER_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`color-swatch ${flowerColor === c.name ? 'is-active' : ''}`}
                    onClick={() => setFlowerColor(c.name)}
                  >
                    <span className="color-dot" style={{ background: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-section">
              <h4>
                Цвет упаковки <span className="pp-demo-tag">демо</span>
              </h4>
              <div className="color-row">
                {WRAP_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`color-swatch ${wrapColor === c.name ? 'is-active' : ''}`}
                    onClick={() => setWrapColor(c.name)}
                  >
                    <span className="color-dot" style={{ background: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-qty-row">
              <span className="field-label" style={{ margin: 0 }}>
                Количество
              </span>
              <div className="modal-qty-row" style={{ margin: 0 }}>
                <button className="qty-btn" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  –
                </button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" type="button" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>
            </div>

            <button className="btn btn-primary" type="button" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={handleAdd}>
              В корзину — {formatPrice(total)}
            </button>

            <div className="pp-accordions">
              <details className="pp-acc">
                <summary>Доставка и самовывоз</summary>
                <div>
                  Доставка по Павлодару — от 90 минут, ежедневно с 08:00 до 24:00. Самовывоз — Торайгырова, 73, 1
                  этаж, в те же часы. Точное время подтвердим в переписке после заказа.
                </div>
              </details>
              <details className="pp-acc">
                <summary>Оплата</summary>
                <div>
                  Наличными или переводом курьеру при получении, либо по реквизитам заранее — способ уточним в
                  переписке. <span className="pp-demo-tag">демо</span>
                </div>
              </details>
              <details className="pp-acc">
                <summary>Уход за букетом</summary>
                <div>
                  Подрежьте стебли под углом, поставьте в чистую воду комнатной температуры, добавьте питание из
                  пакетика. Меняйте воду каждые 2 дня, держите подальше от прямого солнца и батарей.
                </div>
              </details>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="pp-related">
            <h3>Вам также понравится</h3>
            <div className="related-row related-row-lg">
              {related.map((r) => (
                <Link key={r.id} href={`/product/${r.id}`} className="related-item">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.name} />
                  ) : (
                    <div style={{ width: '100%', height: 140, borderRadius: 16, background: 'var(--surface-2)' }} />
                  )}
                  <div className="rn">{r.name}</div>
                  <div className="rp">{formatPrice(r.price)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pp-mobile-bar">
        <div>
          <span className="pp-mobile-label">Итого</span>
          <span className="pp-mobile-price">{formatPrice(total)}</span>
        </div>
        <button className="btn btn-primary" type="button" onClick={handleAdd}>
          В корзину
        </button>
      </div>

      {lightboxOpen && images[0] && (
        <div className="lightbox open" onClick={() => setLightboxOpen(false)}>
          <button className="sheet-close" style={{ position: 'fixed', top: 16, right: 16 }} type="button" aria-label="Закрыть">
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt={product.name} />
        </div>
      )}
    </div>
  );
}
