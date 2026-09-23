// Re-exported (type-only, so none of lib/db.ts's server-only `pg` runtime
// code reaches the client bundle) rather than duplicated — this used to be
// its own copy of the shape and drifted out of sync when db.ts gained new
// columns.
import type { Product, ProductVariant, Category } from './db';
export type { Product, ProductVariant, Category };

export type CartItem = {
  id: string;
  name: string;
  price: number;
  sizeLabel: string;
  qty: number;
  image?: string | null;
};

/** Product names are internal codes ("Букет 8490") with no descriptive
 * value — the real composition ("Белая роза 51 стебель") lives in
 * `description`, already typed in by an admin. Combines them into one
 * display string for titles/H1s instead of inventing new copy. */
export function productDisplayTitle(p: Pick<Product, 'name' | 'description'>): string {
  const name = (p.name ?? '').trim();
  const hint = (p.description ?? '').split('\n')[0]?.trim();
  if (hint && hint !== name) return `${name} — ${hint}`;
  return name;
}

export function formatPrice(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' тнг';
}
