export type Product = {
  id: string;
  name: string;
  number: number | null;
  price: number;
  description: string | null;
  image: string | null;
  images: string[];
  category: 'bouquet' | 'gift' | 'addon' | 'included';
  tag: string | null;
  available: boolean;
  order_count?: number;
};

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
