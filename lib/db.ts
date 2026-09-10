import { sql } from '@vercel/postgres';

export type Product = {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  image: string | null;
  category: 'bouquet' | 'gift';
  tag: string | null;
  available: boolean;
  sort_order: number;
};

let schemaReady: Promise<void> | null = null;

/** Creates the products table on first use. Safe to call repeatedly. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql`
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
    `.then(() => undefined);
  }
  return schemaReady;
}

export async function listProducts(category?: 'bouquet' | 'gift'): Promise<Product[]> {
  await ensureSchema();
  const result = category
    ? await sql<Product>`SELECT * FROM products WHERE category = ${category} ORDER BY sort_order ASC, created_at ASC`
    : await sql<Product>`SELECT * FROM products ORDER BY sort_order ASC, created_at ASC`;
  return result.rows;
}

export async function getProduct(id: string): Promise<Product | null> {
  await ensureSchema();
  const result = await sql<Product>`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
  return result.rows[0] ?? null;
}

export async function upsertProduct(p: {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  image: string | null;
  category: 'bouquet' | 'gift';
  tag: string | null;
  available: boolean;
  sort_order?: number;
}): Promise<Product> {
  await ensureSchema();
  const result = await sql<Product>`
    INSERT INTO products (id, name, number, price, description, image, category, tag, available, sort_order)
    VALUES (${p.id}, ${p.name}, ${p.number}, ${p.price}, ${p.description}, ${p.image}, ${p.category}, ${p.tag}, ${p.available}, ${p.sort_order ?? 0})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      number = EXCLUDED.number,
      price = EXCLUDED.price,
      description = EXCLUDED.description,
      image = COALESCE(EXCLUDED.image, products.image),
      category = EXCLUDED.category,
      tag = EXCLUDED.tag,
      available = EXCLUDED.available
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteProduct(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM products WHERE id = ${id}`;
}

export async function countProducts(): Promise<number> {
  await ensureSchema();
  const result = await sql<{ count: string }>`SELECT COUNT(*)::text as count FROM products`;
  return parseInt(result.rows[0]?.count ?? '0', 10);
}
