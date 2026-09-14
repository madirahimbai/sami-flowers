'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart-context';

const BRANCHES = [
  { label: 'Торайгырова, 73', phone: '77761115319' },
  { label: 'Амангельды, 23', phone: '77076828707' },
];

export default function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactMenu, setContactMenu] = useState<'phone' | 'whatsapp' | null>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contactMenu) return;
    function onClickOutside(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) setContactMenu(null);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [contactMenu]);

  return (
    <>
      <div className="util-bar">
        <div className="wrap">
          <div className="util-left">
            <span className="util-pill">Павлодар</span>
            <span className="util-hours">Доставляем с 08:00 до 24:00</span>
          </div>
          <div className="util-right">
            <a className="util-link" href="https://go.2gis.com/blll3" target="_blank" rel="noreferrer">
              <svg className="icon is-star" viewBox="0 0 24 24">
                <path d="M12 2l2.9 6.9L22 9.7l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.5L2 9.7l7.1-.8z" />
              </svg>
              4,9 · 483 отзыва
            </a>
            <a className="util-link" href="https://instagram.com/samiflowers_pvl" target="_blank" rel="noreferrer">
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              @samiflowers_pvl
            </a>
          </div>
        </div>
      </div>
      <div className="nav-shell">
        <div className="nav-pill wrap" style={{ maxWidth: 1132 }}>
          <Link className="brand" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src="/logo.svg" alt="Sami Flowers" />
          </Link>
          <ul className="nav-links">
            <li>
              <Link href="/#catalog">Каталог</Link>
            </li>
            <li>
              <Link href="/#contacts">Контакты</Link>
            </li>
          </ul>
          <div className="nav-cta" ref={contactRef}>
            <div className="contact-popover-wrap">
              <button
                className="icon-btn"
                type="button"
                aria-label="Позвонить"
                onClick={() => setContactMenu((m) => (m === 'phone' ? null : 'phone'))}
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.99.36 1.96.68 2.89a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.19-1.27a2 2 0 012.11-.45c.93.32 1.9.55 2.89.68A2 2 0 0122 16.92z" />
                </svg>
              </button>
              {contactMenu === 'phone' && (
                <div className="contact-popover">
                  <span className="contact-popover-label">Позвонить</span>
                  {BRANCHES.map((b) => (
                    <a key={b.phone} href={`tel:+${b.phone}`} onClick={() => setContactMenu(null)}>
                      {b.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a
              className="icon-btn"
              href="https://instagram.com/samiflowers_pvl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg className="icon" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <div className="contact-popover-wrap">
              <button
                className="icon-btn is-accent"
                type="button"
                aria-label="Написать в WhatsApp"
                onClick={() => setContactMenu((m) => (m === 'whatsapp' ? null : 'whatsapp'))}
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </button>
              {contactMenu === 'whatsapp' && (
                <div className="contact-popover">
                  <span className="contact-popover-label">Написать в WhatsApp</span>
                  {BRANCHES.map((b) => (
                    <a
                      key={b.phone}
                      href={`https://wa.me/${b.phone}?text=${encodeURIComponent('Здравствуйте! Хочу заказать букет')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setContactMenu(null)}
                    >
                      {b.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button
              className="icon-btn nav-cart-btn"
              type="button"
              onClick={openCart}
              aria-label="Корзина"
              style={{ position: 'relative' }}
            >
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6L4.5 3H2" />
                <circle cx="9.5" cy="20" r="1.2" />
                <circle cx="17.5" cy="20" r="1.2" />
              </svg>
              {count > 0 && <span className="tab-fav-count">{count}</span>}
            </button>
            <button
              className={`burger ${menuOpen ? 'open' : ''}`}
              type="button"
              aria-label="Меню"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      <div className={`mobile-overlay ${menuOpen ? 'open' : ''}`}>
        <button className="icon-btn mobile-overlay-close" type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}>
          ×
        </button>
        <Link href="/#catalog" onClick={() => setMenuOpen(false)}>
          Каталог
        </Link>
        <Link href="/#contacts" onClick={() => setMenuOpen(false)}>
          Контакты
        </Link>
        <span className="mobile-overlay-label">Позвонить</span>
        {BRANCHES.map((b) => (
          <a key={`tel-${b.phone}`} href={`tel:+${b.phone}`} onClick={() => setMenuOpen(false)}>
            {b.label}
          </a>
        ))}
        <span className="mobile-overlay-label">WhatsApp</span>
        {BRANCHES.map((b) => (
          <a
            key={`wa-${b.phone}`}
            href={`https://wa.me/${b.phone}?text=${encodeURIComponent('Здравствуйте! Хочу заказать букет')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            {b.label}
          </a>
        ))}
        <a
          href="https://instagram.com/samiflowers_pvl"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
        >
          Instagram
        </a>
      </div>
    </>
  );
}
