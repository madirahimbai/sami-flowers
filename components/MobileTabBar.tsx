'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

export default function MobileTabBar() {
  const { count, openCart, favorites, openFavorites } = useCart();

  return (
    <nav className="tab-bar" aria-label="Навигация">
      <Link className="tab-item" href="/#catalog">
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
        Каталог
      </Link>
      <button
        className={`tab-item ${favorites.size > 0 ? 'is-fav-active' : ''}`}
        type="button"
        onClick={openFavorites}
      >
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M12 21s-7-4.35-9.5-8.5C.7 8.9 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5.3 3.9 3.5 7.5C19 16.65 12 21 12 21z" />
        </svg>
        Избранное
        {favorites.size > 0 && <span className="tab-fav-count">{favorites.size}</span>}
      </button>
      <button className="tab-item" type="button" onClick={openCart}>
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M6 6h15l-1.5 9h-12z" />
          <path d="M6 6L4.5 3H2" />
          <circle cx="9.5" cy="20" r="1.2" />
          <circle cx="17.5" cy="20" r="1.2" />
        </svg>
        Корзина
        {count > 0 && <span className="tab-fav-count">{count}</span>}
      </button>
    </nav>
  );
}
