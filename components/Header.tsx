'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const WHATSAPP_NUMBER = '77761115319';

export default function Header() {
  const { count, openCart } = useCart();

  return (
    <>
      <div className="util-bar">
        <div className="wrap">
          <span className="util-pill">Павлодар</span>
          <span className="util-hours">Доставляем с 08:00 до 24:00</span>
        </div>
      </div>
      <div className="nav-shell">
        <div className="nav-pill wrap" style={{ maxWidth: 1132 }}>
          <Link className="brand" href="/">
            <span className="brand-name">Sami Flowers</span>
          </Link>
          <ul className="nav-links">
            <li>
              <Link href="/#catalog">Каталог</Link>
            </li>
            <li>
              <Link href="/#contacts">Контакты</Link>
            </li>
          </ul>
          <div className="nav-cta">
            <a className="icon-btn" href="tel:+77761115319" aria-label="Позвонить">
              <svg className="icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.99.36 1.96.68 2.89a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.19-1.27a2 2 0 012.11-.45c.93.32 1.9.55 2.89.68A2 2 0 0122 16.92z" /></svg>
            </a>
            <a
              className="icon-btn is-accent"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Здравствуйте! Хочу заказать букет')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать в WhatsApp"
            >
              <svg className="icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
            </a>
            <button className="icon-btn" type="button" onClick={openCart} aria-label="Корзина" style={{ position: 'relative' }}>
              <svg className="icon" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L4.5 3H2" /><circle cx="9.5" cy="20" r="1.2" /><circle cx="17.5" cy="20" r="1.2" /></svg>
              {count > 0 && <span className="tab-fav-count">{count}</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
