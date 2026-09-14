import { Product } from './types';

/** Detects rose-based bouquets from real admin-entered composition text
 * (`description`, e.g. "15 белых роз", "Кустовая Роза Софи 11 веток") —
 * there is no dedicated DB category for roses, so this reads the same data
 * an admin already typed in rather than inventing a new taxonomy. */
export function isRoseProduct(p: Pick<Product, 'name' | 'description'>): boolean {
  const text = `${p.name ?? ''} ${p.description ?? ''}`;
  return /роз/i.test(text);
}
