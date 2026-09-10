'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { CartItem } from './types';

type CartContextValue = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'sami-cart';
const FAV_KEY = 'sami-favorites';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isCartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawCart = localStorage.getItem(CART_KEY);
      if (rawCart) setCart(JSON.parse(rawCart));
    } catch {}
    try {
      const rawFav = localStorage.getItem(FAV_KEY);
      if (rawFav) setFavorites(new Set(JSON.parse(rawFav)));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
    } catch {}
  }, [favorites, hydrated]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id && c.sizeLabel === item.sizeLabel);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const value: CartContextValue = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    total,
    count,
    isCartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    favorites,
    toggleFavorite,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
