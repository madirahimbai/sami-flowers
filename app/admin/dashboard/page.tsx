'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';

function emptyProduct(category: 'bouquet' | 'gift'): Product {
  return {
    id: '',
    name: '',
    number: null,
    price: 0,
    description: '',
    image: null,
    category,
    tag: null,
    available: true,
  };
}

function ProductRow({
  product,
  onSaved,
  onDeleted,
  isNew,
}: {
  product: Product;
  onSaved: (p: Product) => void;
  onDeleted: (id: string) => void;
  isNew?: boolean;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus('idle');
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'upload_failed');
      update('image', data.url);
    } catch {
      setStatusMsg('Не удалось загрузить фото');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.id.trim() || !draft.name.trim()) {
      setStatusMsg('Заполните id и название');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setStatusMsg('');
    try {
      const method = isNew ? 'POST' : 'PATCH';
      const url = isNew ? '/api/products' : `/api/products/${encodeURIComponent(product.id)}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'save_failed');
      setStatus('ok');
      setStatusMsg('Сохранено');
      onSaved(data.product);
    } catch (e: any) {
      setStatus('error');
      setStatusMsg('Ошибка сохранения');
    }
  }

  async function remove() {
    if (isNew) {
      onDeleted(product.id);
      return;
    }
    if (!confirm(`Удалить «${draft.name}»?`)) return;
    setStatus('saving');
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete_failed');
      onDeleted(product.id);
    } catch {
      setStatus('error');
      setStatusMsg('Не удалось удалить');
    }
  }

  return (
    <div className="admin-row">
      <div>
        {draft.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.image} alt="" />
        ) : (
          <div className="admin-row-noimg">нет фото</div>
        )}
        <label className="ar-photo">
          {uploading ? 'Загрузка…' : 'Заменить фото'}
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
        </label>
      </div>
      <div className="ar-fields">
        {isNew && (
          <div className="ar-line">
            <input
              className="cart-input"
              placeholder="id (латиницей, например buket-200)"
              value={draft.id}
              onChange={(e) => update('id', e.target.value.trim())}
            />
          </div>
        )}
        <div className="ar-line">
          <input
            className="cart-input"
            placeholder="Название"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <input
            className="cart-input ar-price"
            type="number"
            placeholder="Цена"
            value={draft.price || ''}
            onChange={(e) => update('price', parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <textarea
          className="cart-input"
          placeholder="Описание / состав"
          value={draft.description ?? ''}
          onChange={(e) => update('description', e.target.value)}
        />
        <div className="ar-line">
          <input
            className="cart-input"
            placeholder="Метка (Хит, Новинка — необязательно)"
            value={draft.tag ?? ''}
            onChange={(e) => update('tag', e.target.value || null)}
          />
          <select
            className="cart-input ar-price"
            value={draft.category}
            onChange={(e) => update('category', e.target.value as 'bouquet' | 'gift')}
          >
            <option value="bouquet">Букет</option>
            <option value="gift">Подарок</option>
          </select>
        </div>
        <label className="ar-avail">
          <input
            type="checkbox"
            checked={draft.available}
            onChange={(e) => update('available', e.target.checked)}
          />
          В наличии
        </label>
        <div className="ar-actions">
          <button className="btn btn-primary" type="button" onClick={save} disabled={status === 'saving'}>
            {status === 'saving' ? 'Сохраняем…' : isNew ? 'Добавить' : 'Сохранить'}
          </button>
          <button className="ar-remove" type="button" onClick={remove}>
            Удалить
          </button>
          {statusMsg && (
            <span className={`admin-status ${status === 'error' ? 'is-error' : 'is-ok'}`}>{statusMsg}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [newRows, setNewRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bouquet' | 'gift'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/products', { cache: 'no-store' });
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  const visible = products.filter((p) => filter === 'all' || p.category === filter);

  return (
    <div className="admin-dashboard-wrap">
      <div className="admin-dashboard-header">
        <h1>Sami Flowers — управление магазином</h1>
        <div>
          <a href="/" target="_blank" rel="noreferrer">
            Открыть сайт
          </a>
          <button type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div>
          <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
            Все ({products.length})
          </button>
          <button className={filter === 'bouquet' ? 'is-active' : ''} onClick={() => setFilter('bouquet')}>
            Букеты
          </button>
          <button className={filter === 'gift' ? 'is-active' : ''} onClick={() => setFilter('gift')}>
            Подарки
          </button>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => setNewRows((r) => [emptyProduct(filter === 'gift' ? 'gift' : 'bouquet'), ...r])}
        >
          + Добавить товар
        </button>
      </div>

      {loading && <p>Загрузка…</p>}

      {newRows.map((p, i) => (
        <ProductRow
          key={`new-${i}`}
          product={p}
          isNew
          onSaved={(saved) => {
            setNewRows((rows) => rows.filter((_, idx) => idx !== i));
            setProducts((prev) => [saved, ...prev]);
          }}
          onDeleted={() => setNewRows((rows) => rows.filter((_, idx) => idx !== i))}
        />
      ))}

      {visible.map((p) => (
        <ProductRow
          key={p.id}
          product={p}
          onSaved={(saved) => setProducts((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))}
          onDeleted={(id) => setProducts((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
}
