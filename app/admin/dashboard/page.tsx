'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category, ProductVariant } from '@/lib/types';

function emptyProduct(category: 'bouquet' | 'gift' | 'addon' | 'included'): Product {
  return {
    id: '',
    name: '',
    number: null,
    price: 0,
    description: '',
    image: null,
    images: [],
    category,
    category_tags: [],
    variants: [],
    tag: null,
    available: true,
    sort_order: 0,
    order_count: 0,
  };
}

const MAX_IMAGES = 5;

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || `cat_${Date.now()}`;
}

function CategoriesPanel({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: (categories: Category[]) => void;
}) {
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState('');

  async function addCategory() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = slugify(trimmed);
    const sort_order = categories.length ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label: trimmed, sort_order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'save_failed');
      const others = categories.filter((c) => c.id !== id);
      onChange([...others, data.category].sort((a, b) => a.sort_order - b.sort_order));
      setLabel('');
      setStatus('');
    } catch {
      setStatus('Не удалось сохранить категорию');
    }
  }

  async function removeCategory(id: string) {
    if (!confirm('Удалить категорию? Она пропадёт из фильтров каталога (у товаров тег останется, но не будет виден).')) return;
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete_failed');
      onChange(categories.filter((c) => c.id !== id));
    } catch {
      setStatus('Не удалось удалить категорию');
    }
  }

  return (
    <div className="categories-panel">
      <h2>Вкладки каталога (категории)</h2>
      <div className="categories-panel-list">
        {categories.length === 0 && <span className="ar-tag-empty">Категорий пока нет</span>}
        {categories.map((c) => (
          <span className="category-chip" key={c.id}>
            {c.label}
            <button type="button" onClick={() => removeCategory(c.id)} aria-label="Удалить">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="categories-panel-add">
        <input
          className="cart-input"
          placeholder="Например: Розы, Кустовые розы"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
        />
        <button type="button" className="btn btn-primary" onClick={addCategory}>
          + Добавить категорию
        </button>
      </div>
      {status && <div className="admin-status is-error">{status}</div>}
    </div>
  );
}

function ProductRow({
  product,
  categories,
  onSaved,
  onDeleted,
  isNew,
}: {
  product: Product;
  categories: Category[];
  onSaved: (p: Product) => void;
  onDeleted: (id: string) => void;
  isNew?: boolean;
}) {
  const [draft, setDraft] = useState<Product>(() => ({
    ...product,
    images: product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : [],
    category_tags: product.category_tags ?? [],
    variants: product.variants ?? [],
  }));
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus('idle');
  }

  function toggleTag(id: string) {
    setDraft((d) => {
      const tags = d.category_tags ?? [];
      const category_tags = tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id];
      return { ...d, category_tags };
    });
    setStatus('idle');
  }

  function updateVariant(idx: number, patch: Partial<ProductVariant>) {
    setDraft((d) => {
      const variants = (d.variants ?? []).map((v, i) => (i === idx ? { ...v, ...patch } : v));
      return { ...d, variants };
    });
    setStatus('idle');
  }

  function addVariant() {
    setDraft((d) => ({ ...d, variants: [...(d.variants ?? []), { label: '', price: d.price || 0, available: true }] }));
    setStatus('idle');
  }

  function removeVariant(idx: number) {
    setDraft((d) => ({ ...d, variants: (d.variants ?? []).filter((_, i) => i !== idx) }));
    setStatus('idle');
  }

  async function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'upload_failed');
      setDraft((d) => {
        const images = [...d.images, data.url].slice(0, MAX_IMAGES);
        return { ...d, images, image: images[0] ?? null };
      });
    } catch {
      setStatusMsg('Не удалось загрузить фото');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(idx: number) {
    setDraft((d) => {
      const images = d.images.filter((_, i) => i !== idx);
      return { ...d, images, image: images[0] ?? null };
    });
  }

  async function resetStats() {
    if (!confirm(`Сбросить счётчик продаж для «${draft.name}»?`)) return;
    try {
      await fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id }),
      });
      setDraft((d) => ({ ...d, order_count: 0 }));
    } catch {
      setStatusMsg('Не удалось сбросить статистику');
      setStatus('error');
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
      <div className="ar-photos">
        {draft.images.length === 0 && <div className="admin-row-noimg">нет фото</div>}
        <div className="ar-photo-grid">
          {draft.images.map((src, i) => (
            <div key={i} className="ar-photo-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button type="button" className="ar-photo-remove" onClick={() => removePhoto(i)} aria-label="Удалить фото">
                ×
              </button>
              {i === 0 && <span className="ar-photo-cover">обложка</span>}
            </div>
          ))}
        </div>
        {draft.images.length < MAX_IMAGES && (
          <label className="ar-photo">
            {uploading ? 'Загрузка…' : `+ Добавить фото (${draft.images.length}/${MAX_IMAGES})`}
            <input type="file" accept="image/*" onChange={handleAddPhoto} disabled={uploading} hidden />
          </label>
        )}
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
        {!isNew && (
          <span className="ar-popularity">
            Продано: {draft.order_count ?? 0} шт
            <button type="button" className="ar-remove" style={{ marginLeft: 8, fontSize: 11 }} onClick={resetStats}>
              сбросить
            </button>
          </span>
        )}
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
            onChange={(e) => update('category', e.target.value as 'bouquet' | 'gift' | 'addon' | 'included')}
          >
            <option value="bouquet">Букет</option>
            <option value="gift">Подарок</option>
            <option value="addon">Доп. товар (украсить букет)</option>
            <option value="included">В комплекте (открытка, подкормка и т.д.)</option>
          </select>
        </div>

        <span className="ar-field-label">Вкладки каталога</span>
        {categories.length === 0 ? (
          <span className="ar-tag-empty">Сначала добавьте категории выше</span>
        ) : (
          <div className="ar-tags">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`ar-tag-chip ${(draft.category_tags ?? []).includes(c.id) ? 'is-active' : ''}`}
                onClick={() => toggleTag(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <span className="ar-field-label">Варианты количества (необязательно, например 11 шт / 25 шт / 31 шт)</span>
        <div className="ar-variants">
          {(draft.variants ?? []).map((v, i) => (
            <div className="ar-variant-row" key={i}>
              <input
                className="cart-input"
                placeholder="Например: 11 шт"
                value={v.label}
                onChange={(e) => updateVariant(i, { label: e.target.value })}
              />
              <input
                className="cart-input ar-price"
                type="number"
                placeholder="Цена"
                value={v.price || ''}
                onChange={(e) => updateVariant(i, { price: parseInt(e.target.value, 10) || 0 })}
              />
              <label>
                <input
                  type="checkbox"
                  checked={v.available}
                  onChange={(e) => updateVariant(i, { available: e.target.checked })}
                />
                в наличии
              </label>
              <button type="button" className="ar-remove" onClick={() => removeVariant(i)}>
                Удалить
              </button>
            </div>
          ))}
          <button type="button" className="ar-variant-add" onClick={addVariant}>
            + Добавить вариант
          </button>
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [newRows, setNewRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bouquet' | 'gift' | 'addon' | 'included'>('all');
  const [sortPopular, setSortPopular] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      fetch('/api/products', { cache: 'no-store' }),
      fetch('/api/categories', { cache: 'no-store' }),
    ]);
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
    setProducts(productsData.products || []);
    setCategories(categoriesData.categories || []);
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

  async function resetAllStats() {
    if (!confirm('Сбросить счётчик продаж у ВСЕХ товаров? Это нельзя отменить.')) return;
    await fetch('/api/admin/reset-stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setProducts((prev) => prev.map((p) => ({ ...p, order_count: 0 })));
  }

  const visible = products
    .filter((p) => filter === 'all' || p.category === filter)
    .sort((a, b) => (sortPopular ? (b.order_count ?? 0) - (a.order_count ?? 0) : 0));

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
          <button className={filter === 'addon' ? 'is-active' : ''} onClick={() => setFilter('addon')}>
            Допы
          </button>
          <button className={filter === 'included' ? 'is-active' : ''} onClick={() => setFilter('included')}>
            В комплекте
          </button>
          <button className={sortPopular ? 'is-active' : ''} onClick={() => setSortPopular((v) => !v)}>
            Сначала популярные
          </button>
          <button onClick={resetAllStats}>Сбросить статистику</button>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() =>
            setNewRows((r) => [
              emptyProduct(filter === 'gift' || filter === 'addon' || filter === 'included' ? filter : 'bouquet'),
              ...r,
            ])
          }
        >
          + Добавить товар
        </button>
      </div>

      <CategoriesPanel categories={categories} onChange={setCategories} />

      {loading && <p>Загрузка…</p>}

      {newRows.map((p, i) => (
        <ProductRow
          key={`new-${i}`}
          product={p}
          categories={categories}
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
          categories={categories}
          onSaved={(saved) => setProducts((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))}
          onDeleted={(id) => setProducts((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
}
