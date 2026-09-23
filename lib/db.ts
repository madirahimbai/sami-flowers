import { Pool } from 'pg';

/** A selectable quantity/size option with its own real price — e.g. roses
 * "11 шт" / "25 шт" / "51 шт", each priced separately rather than derived
 * by multiplying a base price. Empty on a product means "no variants set
 * up yet", in which case the storefront just sells the product at its own
 * `price`, unchanged. */
export type ProductVariant = { label: string; price: number; available: boolean };

/** Admin-managed catalog tab (e.g. "Розы", "Цветы в коробках"). A product
 * can carry any number of these in `category_tags`. */
export type Category = { id: string; label: string; sort_order: number };

export type Product = {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  image: string | null; // data: URI (base64) — stored directly in the row
  images: string[]; // up to 5 data: URIs — first one mirrors `image` as the cover photo
  category: 'bouquet' | 'gift' | 'addon' | 'included';
  category_tags: string[]; // ids into the `categories` table — admin-assigned catalog tabs
  variants: ProductVariant[];
  tag: string | null;
  available: boolean;
  sort_order: number;
  order_count: number; // total units ever ordered — powers the "popular" sort in admin
};

declare global {
  // eslint-disable-next-line no-var
  var __samiPgPool: Pool | undefined;
}

function pool(): Pool {
  if (!global.__samiPgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    // Railway's managed Postgres presents a cert chain that Node's default
    // CA store doesn't recognize; rejectUnauthorized:false is Railway's own
    // documented workaround for `pg` connections (the DB is only reachable
    // over Railway's private network, not the public internet, so this
    // isn't exposed to a public-MITM scenario the way it would be for an
    // internet-facing endpoint). Set sslmode=disable in DATABASE_URL for a
    // provider that terminates TLS differently.
    global.__samiPgPool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
      // node-postgres defaults to 10 — bumped for headroom under concurrent
      // storefront traffic (each page load is 1-2 short queries, not
      // long-held connections, so this stays well within what a small
      // managed Postgres instance comfortably serves).
      max: 20,
    });
  }
  return global.__samiPgPool;
}

let schemaReady: Promise<void> | null = null;

/** Creates the products table on first use. Safe to call repeatedly. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool()
      .query(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          number INTEGER,
          price INTEGER NOT NULL,
          description TEXT,
          image TEXT,
          category TEXT NOT NULL DEFAULT 'bouquet',
          tag TEXT,
          available BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)
      .then(() =>
        // Added after the initial launch — a one-time metadata backfill for
        // existing rows, no data migration needed since Postgres 11+.
        pool().query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb`)
      )
      .then(() =>
        pool().query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS order_count INTEGER NOT NULL DEFAULT 0`)
      )
      .then(() =>
        // Tiny key-value table backing /api/monitor's health checks — lets it
        // tell "still broken" apart from "just broke" so it only pages once
        // per state change instead of every run.
        pool().query(`
          CREATE TABLE IF NOT EXISTS monitor_state (
            check_name TEXT PRIMARY KEY,
            ok BOOLEAN NOT NULL,
            detail TEXT,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `)
      )
      .then(() =>
        pool().query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category_tags JSONB NOT NULL DEFAULT '[]'::jsonb`)
      )
      .then(() =>
        pool().query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb`)
      )
      .then(() =>
        // Admin-managed catalog tabs (Розы, Кустовые розы, ...) — products
        // reference these by id in `category_tags` rather than the storefront
        // guessing categories from description text.
        pool().query(`
          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `)
      )
      .then(() => undefined);
  }
  return schemaReady;
}

export type MonitorCheckName = 'site' | 'telegram_token' | 'telegram_delivery';

/** Null means "no prior run" — the caller uses that to skip alerting on the
 * very first check instead of treating it as a fake state change. */
export async function getMonitorState(name: MonitorCheckName): Promise<boolean | null> {
  await ensureSchema();
  const result = await pool().query<{ ok: boolean }>('SELECT ok FROM monitor_state WHERE check_name = $1', [name]);
  return result.rows[0]?.ok ?? null;
}

export async function setMonitorState(name: MonitorCheckName, ok: boolean, detail: string | null): Promise<void> {
  await ensureSchema();
  await pool().query(
    `INSERT INTO monitor_state (check_name, ok, detail, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (check_name) DO UPDATE SET ok = $2, detail = $3, updated_at = now()`,
    [name, ok, detail]
  );
}

// Storefront listings (catalog grid, related bouquets, addon/included-item
// rows) only ever render the single cover `image` — never the full gallery.
// Pulling `images` (up to 5 base64 photos per row) on every listing query
// multiplies bytes read from Postgres and sent over the wire for nothing,
// which matters once real concurrent traffic hits the catalog page.
//
// The cover `image` itself is also NOT pulled as raw base64 here — with the
// full catalog (~100 products) rendered on one page, embedding every cover
// photo inline made the homepage's RSC payload several MB even with
// compressed photos, since Next.js serializes whatever a Server Component
// passes as props to a Client Component. Instead this returns a fetchable
// `/api/products/{id}/image` URL, which an <img> tag treats exactly like a
// data: URI — same rendering, but the bytes ship as a separate, cacheable,
// actually-lazy-loadable request instead of bloating the initial HTML.
const LIST_COLUMNS =
  'id, name, number, price, description, (image IS NOT NULL) as has_image, category, category_tags, variants, tag, available, sort_order, order_count';

type ListRow = {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  has_image: boolean;
  category: Product['category'];
  category_tags: string[];
  variants: ProductVariant[];
  tag: string | null;
  available: boolean;
  sort_order: number;
  order_count: number;
};

export async function listProducts(category?: 'bouquet' | 'gift' | 'addon' | 'included'): Promise<Product[]> {
  await ensureSchema();
  const result = category
    ? await pool().query<ListRow>(`SELECT ${LIST_COLUMNS} FROM products WHERE category = $1 ORDER BY price ASC, created_at ASC`, [category])
    : await pool().query<ListRow>(`SELECT ${LIST_COLUMNS} FROM products ORDER BY price ASC, created_at ASC`);
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    number: r.number,
    price: r.price,
    description: r.description,
    image: r.has_image ? `/api/products/${r.id}/image` : null,
    images: [],
    category: r.category,
    category_tags: r.category_tags ?? [],
    variants: r.variants ?? [],
    tag: r.tag,
    available: r.available,
    sort_order: r.sort_order,
    order_count: r.order_count,
  }));
}

/** Same as listProducts but includes the full `images` gallery array — for
 * the admin dashboard, which needs every photo to manage them. */
export async function listProductsFull(category?: 'bouquet' | 'gift' | 'addon' | 'included'): Promise<Product[]> {
  await ensureSchema();
  const result = category
    ? await pool().query<Product>('SELECT * FROM products WHERE category = $1 ORDER BY price ASC, created_at ASC', [category])
    : await pool().query<Product>('SELECT * FROM products ORDER BY price ASC, created_at ASC');
  return result.rows;
}

export async function getProduct(id: string): Promise<Product | null> {
  await ensureSchema();
  const result = await pool().query<Product>('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] ?? null;
}

export async function upsertProduct(p: {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  image: string | null;
  images?: string[] | null;
  category: 'bouquet' | 'gift' | 'addon' | 'included';
  category_tags?: string[] | null;
  variants?: ProductVariant[] | null;
  tag: string | null;
  available: boolean;
  sort_order?: number;
}): Promise<Product> {
  await ensureSchema();
  // `undefined` (the seed script's case) means "leave alone" for each of
  // these — only an explicitly-passed value (even [], for a category or
  // variant list the admin cleared out) overwrites, so re-running the seed
  // or an integration that doesn't know about these fields can't wipe out
  // an admin's photos/tags/variants.
  const hasImages = p.images !== undefined && p.images !== null;
  const hasCategoryTags = p.category_tags !== undefined && p.category_tags !== null;
  const hasVariants = p.variants !== undefined && p.variants !== null;
  const result = await pool().query<Product>(
    `INSERT INTO products (id, name, number, price, description, image, images, category, category_tags, variants, tag, available, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       number = EXCLUDED.number,
       price = EXCLUDED.price,
       description = EXCLUDED.description,
       image = COALESCE(EXCLUDED.image, products.image),
       images = ${hasImages ? 'EXCLUDED.images' : 'products.images'},
       category = EXCLUDED.category,
       category_tags = ${hasCategoryTags ? 'EXCLUDED.category_tags' : 'products.category_tags'},
       variants = ${hasVariants ? 'EXCLUDED.variants' : 'products.variants'},
       tag = EXCLUDED.tag,
       available = EXCLUDED.available
     RETURNING *`,
    [
      p.id,
      p.name,
      p.number,
      p.price,
      p.description,
      p.image,
      JSON.stringify(p.images ?? []),
      p.category,
      JSON.stringify(p.category_tags ?? []),
      JSON.stringify(p.variants ?? []),
      p.tag,
      p.available,
      p.sort_order ?? 0,
    ]
  );
  return result.rows[0];
}

/** Bumps each product's running "units ordered" total — best-effort, called
 * once per checkout so the admin panel can surface popular bouquets. */
export async function incrementOrderCounts(items: { id: string; qty: number }[]): Promise<void> {
  await ensureSchema();
  for (const item of items) {
    try {
      await pool().query('UPDATE products SET order_count = order_count + $1 WHERE id = $2', [item.qty, item.id]);
    } catch {
      // best-effort stat — must never block an order
    }
  }
}

export async function resetOrderCount(id: string): Promise<void> {
  await ensureSchema();
  await pool().query('UPDATE products SET order_count = 0 WHERE id = $1', [id]);
}

export async function resetAllOrderCounts(): Promise<void> {
  await ensureSchema();
  await pool().query('UPDATE products SET order_count = 0');
}

/** Overwrites just the photo columns — used by the one-time recompression
 * cleanup so it doesn't disturb name/price/etc. via the general upsert. */
export async function updateProductImages(id: string, image: string | null, images: string[]): Promise<void> {
  await ensureSchema();
  await pool().query('UPDATE products SET image = $1, images = $2 WHERE id = $3', [image, JSON.stringify(images), id]);
}

/** Overwrites just name + article number — used by the one-time
 * name/article migration so it doesn't disturb photos/price/etc. */
export async function updateProductNaming(id: string, name: string, number: number): Promise<void> {
  await ensureSchema();
  await pool().query('UPDATE products SET name = $1, number = $2 WHERE id = $3', [name, number, id]);
}

export async function deleteProduct(id: string): Promise<void> {
  await ensureSchema();
  await pool().query('DELETE FROM products WHERE id = $1', [id]);
}

export async function countProducts(): Promise<number> {
  await ensureSchema();
  const result = await pool().query<{ count: string }>('SELECT COUNT(*)::text as count FROM products');
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

/** Validates/coerces whatever an API request body sent as `variants` into a
 * clean ProductVariant[], dropping malformed rows instead of throwing —
 * called from the product API routes before handing the value to
 * upsertProduct. */
export function sanitizeVariants(input: unknown): ProductVariant[] {
  if (!Array.isArray(input)) return [];
  const out: ProductVariant[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const label = String((raw as any).label ?? '').trim();
    const price = Number((raw as any).price);
    if (!label || !Number.isFinite(price) || price < 0) continue;
    out.push({ label, price: Math.round(price), available: (raw as any).available !== false });
  }
  return out;
}

export async function listCategories(): Promise<Category[]> {
  await ensureSchema();
  const result = await pool().query<Category>('SELECT * FROM categories ORDER BY sort_order ASC, label ASC');
  return result.rows;
}

export async function upsertCategory(c: { id: string; label: string; sort_order?: number }): Promise<Category> {
  await ensureSchema();
  const result = await pool().query<Category>(
    `INSERT INTO categories (id, label, sort_order) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
     RETURNING *`,
    [c.id, c.label, c.sort_order ?? 0]
  );
  return result.rows[0];
}

export async function deleteCategory(id: string): Promise<void> {
  await ensureSchema();
  await pool().query('DELETE FROM categories WHERE id = $1', [id]);
}
