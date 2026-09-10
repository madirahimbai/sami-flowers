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
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  sizeLabel: string;
  qty: number;
};

export function formatPrice(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' тнг';
}
