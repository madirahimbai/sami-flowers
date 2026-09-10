import { Pool } from 'pg';

export type Product = {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  image: string | null; // data: URI (base64) — stored directly in the row
  images: string[]; // up to 5 data: URIs — first one mirrors `image` as the cover photo
  category: 'bouquet' | 'gift' | 'addon' | 'included';
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
      .then(() => undefined);
  }
  return schemaReady;
}

export async function listProducts(category?: 'bouquet' | 'gift' | 'addon' | 'included'): Promise<Product[]> {
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
  tag: string | null;
  available: boolean;
  sort_order?: number;
}): Promise<Product> {
  await ensureSchema();
  // `undefined` (the seed script's case) means "leave photos alone" — only an
  // explicitly-passed array (even []) overwrites, so re-running the seed
  // can't wipe out photos an admin has since uploaded through the dashboard.
  const hasImages = p.images !== undefined && p.images !== null;
  const result = await pool().query<Product>(
    `INSERT INTO products (id, name, number, price, description, image, images, category, tag, available, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       number = EXCLUDED.number,
       price = EXCLUDED.price,
       description = EXCLUDED.description,
       image = COALESCE(EXCLUDED.image, products.image),
       images = ${hasImages ? 'EXCLUDED.images' : 'products.images'},
       category = EXCLUDED.category,
       tag = EXCLUDED.tag,
       available = EXCLUDED.available
     RETURNING *`,
    [p.id, p.name, p.number, p.price, p.description, p.image, JSON.stringify(p.images ?? []), p.category, p.tag, p.available, p.sort_order ?? 0]
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

export async function deleteProduct(id: string): Promise<void> {
  await ensureSchema();
  await pool().query('DELETE FROM products WHERE id = $1', [id]);
}

export async function countProducts(): Promise<number> {
  await ensureSchema();
  const result = await pool().query<{ count: string }>('SELECT COUNT(*)::text as count FROM products');
  return parseInt(result.rows[0]?.count ?? '0', 10);
}
