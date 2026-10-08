'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, formatPrice } from '@/lib/types';

const CATEGORY_LABELS: Record<Product['category'], string> = {
  bouquet: 'Букеты',
  gift: 'Подарки',
  addon: 'Допы',
  included: 'В комплекте',
};

type StatusFilter = 'all' | 'in' | 'out';

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е');
}

export default function AvailabilityClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<'all' | Product['category']>('all');
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const inStockTotal = items.filter((p) => p.available).length;

  const categories = useMemo(
    () => (Object.keys(CATEGORY_LABELS) as Product['category'][]).filter((c) => items.some((p) => p.category === c)),
    [items]
  );

  // Counts on the status chips follow the search + category, so they always
  // describe the list the manager is currently looking at.
  const scoped = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return normalize(`${p.name} ${p.number ?? ''} ${p.description ?? ''}`).includes(q);
    });
  }, [items, query, category]);

  const visible = scoped.filter((p) => status === 'all' || (status === 'in' ? p.available : !p.available));

  function setAvailable(id: string, available: boolean) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, available } : p)));
  }

  async function toggle(p: Product) {
    if (pending.has(p.id)) return;
    const next = !p.available;
    setError('');
    setPending((s) => new Set(s).add(p.id));
    setAvailable(p.id, next);
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, available: next }),
      });
      if (res.status === 401) {
        window.location.href = '/admin?next=/admin/availability';
        return;
      }
      if (!res.ok) throw new Error('save_failed');
    } catch {
      setAvailable(p.id, !next);
      setError(`Не удалось сохранить «${p.name}» — проверьте интернет и попробуйте ещё раз.`);
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(p.id);
        return n;
      });
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="av-wrap">
      <header className="av-head">
        <div className="av-head-top">
          <h1>Наличие товаров</h1>
          <div className="av-head-links">
            <a href="/admin/dashboard">Админка</a>
            <button type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
        <p className="av-count">
          В наличии на сайте: <strong>{inStockTotal}</strong> из {items.length}
        </p>
        <input
          className="av-search"
          type="search"
          placeholder="Поиск: название, артикул или состав"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="av-chips">
          <button type="button" className={status === 'all' ? 'is-active' : ''} onClick={() => setStatus('all')}>
            Все · {scoped.length}
          </button>
          <button type="button" className={status === 'in' ? 'is-active' : ''} onClick={() => setStatus('in')}>
            В наличии · {scoped.filter((p) => p.available).length}
          </button>
          <button type="button" className={status === 'out' ? 'is-active' : ''} onClick={() => setStatus('out')}>
            Нет · {scoped.filter((p) => !p.available).length}
          </button>
        </div>
        <div className="av-chips">
          <button type="button" className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>
            Все категории
          </button>
          {categories.map((c) => (
            <button key={c} type="button" className={category === c ? 'is-active' : ''} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        {error && (
          <div className="av-error" role="alert">
            {error}
          </div>
        )}
      </header>

      {visible.length === 0 ? (
        <p className="av-empty">Ничего не найдено.</p>
      ) : (
        <ul className="av-list">
          {visible.map((p) => (
            <li key={p.id} className={`av-row ${p.available ? '' : 'is-out'}`}>
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="av-photo" src={p.image} alt="" loading="lazy" />
              ) : (
                <span className="av-photo av-photo-empty" />
              )}
              <div className="av-info">
                <span className="av-name">{p.name}</span>
                <span className="av-meta">
                  {p.number !== null ? `Артикул ${p.number} · ` : ''}
                  {formatPrice(p.price)}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={p.available}
                aria-label={`${p.name}: ${p.available ? 'в наличии' : 'нет в наличии'}`}
                className={`av-switch ${p.available ? 'is-on' : ''}`}
                disabled={pending.has(p.id)}
                onClick={() => toggle(p)}
              >
                <span className="av-switch-knob" />
                <span className="av-switch-label">{p.available ? 'Есть' : 'Нет'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
