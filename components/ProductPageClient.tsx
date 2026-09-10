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

const ADVANTAGES = [
  {
    label: 'Фото букета перед отправкой в WhatsApp',
    icon: <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />,
    icon2: <circle cx="12" cy="13" r="4" />,
  },
  {
    label: 'Доставка от 90 минут по Павлодару',
    icon: <circle cx="12" cy="12" r="9" />,
    icon2: <path d="M12 7v5l3.5 3.5" />,
  },
  {
    label: 'Свежие цветы, сборка в день заказа',
    icon: <path d="M12 3c2 3 2 5 0 7-2-2-2-4 0-7z" />,
    icon2: <path d="M12 10v11M8 15c0 2 2 4 4 4M16 15c0 2-2 4-4 4" />,
  },
  {
    label: 'Оплата при получении или переводом',
    icon: <rect x="2" y="5" width="20" height="14" rx="3" />,
    icon2: <path d="M2 10h20" />,
  },
];

const INCLUDED_ITEMS = [
  {
    label: 'Открытка в подарок',
    icon: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 8l9 6 9-6" />
      </>
    ),
  },
  {
    label: 'Инструкция по уходу',
    icon: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
  },
  {
    label: 'Подкормка для цветов',
    icon: (
      <>
        <path d="M12 3c3 3.5 5 6.7 5 9.5a5 5 0 01-10 0C7 9.7 9 6.5 12 3z" />
      </>
    ),
  },
  {
    label: 'Фирменная упаковка',
    icon: (
      <>
        <path d="M3 8l9-5 9 5-9 5-9-5z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </>
    ),
  },
  {
    label: 'Аквабокс для перевозки',
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18" />
      </>
    ),
  },
];

export default function ProductPageClient({
  product,
  related,
  addons,
}: {
  product: Product;
  related: Product[];
  addons: Product[];
}) {
  const { addToCart, openCart } = useCart();
  const [mult, setMult] = useState(1);
  const [flowerColor, setFlowerColor] = useState(FLOWER_COLORS[0].name);
  const [wrapColor, setWrapColor] = useState(WRAP_COLORS[0].name);
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const images = product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : [];
  const unitPrice = Math.round(product.price * mult);
  const addonsTotal = addons.filter((a) => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0);
  const total = unitPrice * qty + addonsTotal;
  const bonusAmount = Math.round(total * 0.05);
  const sizeLabel = SIZE_CHIPS.find((c) => c.mult === mult)?.label ?? 'Стандарт';

  function prevImage() {
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
  }
  function nextImage() {
    setActiveIdx((i) => (i + 1) % images.length);
  }
  function toggleAddon(id: string) {
    setSelectedAddons((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    addToCart({
      id: product.id,
      name: product.name,
      price: unitPrice,
      sizeLabel: `${sizeLabel} · ${flowerColor} · упаковка ${wrapColor}`,
      qty,
    });
    for (const a of addons) {
      if (selectedAddons.has(a.id)) {
        addToCart({ id: a.id, name: a.name, price: a.price, sizeLabel: 'Доп. товар', qty: 1 });
      }
    }
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
                  <button
                    key={i}
                    className={`pp-thumb ${i === activeIdx ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="pp-main">
              {images[activeIdx] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="pp-main-img"
                  src={images[activeIdx]}
                  alt={product.name}
                  onClick={() => setLightboxOpen(true)}
                />
              ) : (
                <svg viewBox="0 0 200 150" style={{ width: '100%', height: '100%' }}>
                  <rect width="200" height="150" fill="var(--surface-2)" />
                  <circle cx="100" cy="75" r="26" fill="var(--accent)" />
                </svg>
              )}
              {images.length > 1 && (
                <>
                  <button className="pp-arrow pp-arrow-prev" type="button" aria-label="Предыдущее фото" onClick={prevImage}>
                    ‹
                  </button>
                  <button className="pp-arrow pp-arrow-next" type="button" aria-label="Следующее фото" onClick={nextImage}>
                    ›
                  </button>
                </>
              )}
              {images[activeIdx] && (
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
            <span className="pp-bonus">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="3" y="8" width="18" height="13" rx="1" />
                <path d="M3 8h18M12 8v13M7.5 8a2.5 2.5 0 010-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 010 5" />
              </svg>
              +{formatPrice(bonusAmount)} бонусами на следующий заказ
            </span>

            <div className="pp-availability">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              В наличии сейчас · доставка от 90 минут по Павлодару
            </div>

            <div className="pp-advantages">
              {ADVANTAGES.map((a, i) => (
                <div key={i} className="pp-adv-item">
                  <span className="icon-wrap">
                    <svg className="icon" viewBox="0 0 24 24">
                      {a.icon}
                      {a.icon2}
                    </svg>
                  </span>
                  <span>{a.label}</span>
                </div>
              ))}
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
              <h4>К этому букету вы обязательно получите</h4>
              <div className="pp-included">
                {INCLUDED_ITEMS.map((it, i) => (
                  <div key={i} className="pp-included-item">
                    <span className="icon-wrap">
                      <svg className="icon" viewBox="0 0 24 24">
                        {it.icon}
                      </svg>
                    </span>
                    <span>{it.label}</span>
                  </div>
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

            {addons.length > 0 && (
              <div className="pp-section">
                <h4>Украсьте ваш букет</h4>
                <div className="pp-addons-row">
                  {addons.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`pp-addon-card ${selectedAddons.has(a.id) ? 'is-active' : ''}`}
                      onClick={() => toggleAddon(a.id)}
                    >
                      <span className="pp-addon-check">✓</span>
                      {a.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="pp-addon-img" src={a.image} alt="" />
                      ) : (
                        <span className="pp-addon-img" />
                      )}
                      <span className="pp-addon-name">{a.name}</span>
                      <span className="pp-addon-price">+{formatPrice(a.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

      {lightboxOpen && images[activeIdx] && (
        <div className="lightbox open" onClick={() => setLightboxOpen(false)}>
          <button
            className="sheet-close"
            style={{ position: 'fixed', top: 16, right: 16 }}
            type="button"
            aria-label="Закрыть"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button
                className="pp-arrow pp-arrow-prev"
                style={{ position: 'fixed', left: 16, top: '50%' }}
                type="button"
                aria-label="Предыдущее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                ‹
              </button>
              <button
                className="pp-arrow pp-arrow-next"
                style={{ position: 'fixed', right: 16, top: '50%' }}
                type="button"
                aria-label="Следующее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[activeIdx]} alt={product.name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
