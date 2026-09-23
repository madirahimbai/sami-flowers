import { Product } from './types';

/** There is no admin-managed category taxonomy beyond the DB's broad
 * bouquet/gift/addon/included split — these finer catalog tabs (roses,
 * exotic, box arrangements, ...) are inferred from the real composition
 * text an admin already typed into `description` (or `name` as a
 * fallback), the same way isRoseProduct worked before. Nothing here
 * invents a variety or color that isn't already written down; a product
 * with no description just won't match anything beyond "Все букеты". */

const EXOTIC_KEYWORDS = ['антуриум', 'орхиде', 'онцидиум', 'стрелиц', 'протея'];
const BOX_KEYWORDS = ['кашпо', 'коробк', 'корзин'];
const FLOWER_KEYWORDS = [
  'роз',
  'гортенз',
  'хризантем',
  'эустом',
  'лил',
  'диантус',
  'момок',
  'канделайт',
  'твид',
  'орхиде',
  'антуриум',
  'онцидиум',
  'дельфиниум',
  'вибурнум',
  'эсперанс',
  'джумели',
];

type NameDesc = Pick<Product, 'name' | 'description'>;

function fullText(p: NameDesc): string {
  return `${p.name ?? ''} ${p.description ?? ''}`.toLowerCase();
}

// The first non-empty line of the composition is treated as the "lead"
// ingredient — descriptions here are consistently written with the
// featured flower first, so this is what decides "is this primarily an
// exotic-flower piece" rather than "does it merely contain one exotic stem
// among many".
function leadLine(p: NameDesc): string {
  const src = (p.description || p.name || '').trim();
  const line = src.split('\n').find((l) => l.trim());
  return (line || '').toLowerCase();
}

function distinctFlowerTypeCount(p: NameDesc): number {
  const t = (p.description || p.name || '').toLowerCase();
  return new Set(FLOWER_KEYWORDS.filter((k) => t.includes(k))).size;
}

export function isRose(p: NameDesc): boolean {
  return /роз/i.test(fullText(p));
}

export function isBushRose(p: NameDesc): boolean {
  return isRose(p) && /кустов/i.test(fullText(p));
}

export function isExotic(p: NameDesc): boolean {
  return EXOTIC_KEYWORDS.some((k) => leadLine(p).includes(k));
}

export function isBoxArrangement(p: NameDesc): boolean {
  return BOX_KEYWORDS.some((k) => fullText(p).includes(k));
}

// Excludes roses — pure rose bouquets already live under "Розы", so this
// tab is for other single-flower-type bouquets (all hydrangea, all
// chrysanthemum, ...).
export function isMono(p: NameDesc): boolean {
  return !isRose(p) && distinctFlowerTypeCount(p) === 1;
}

export function isAssorted(p: NameDesc): boolean {
  return !isRose(p) && distinctFlowerTypeCount(p) >= 2;
}

// The catalog tabs themselves (Розы, Кустовые розы, ...) are now admin-owned
// rows in the `categories` table, assigned per product via `category_tags`
// — see app/api/admin/migrate-categories, which seeds that table using
// these same functions as the starting assignment. The functions stay
// exported so that one-time seed can call them; CatalogClient no longer
// filters by running them live.

const COLOR_KEYWORDS: { id: string; label: string; hex: string; keywords: string[] }[] = [
  { id: 'red', label: 'Красный', hex: '#c0392b', keywords: ['красн'] },
  { id: 'white', label: 'Белый', hex: '#f4f1ea', keywords: ['бел'] },
  { id: 'pink', label: 'Розовый', hex: '#eb9fb4', keywords: ['розов'] },
  { id: 'purple', label: 'Фиолетовый', hex: '#8e6bb0', keywords: ['фиолет', 'сиреневый', 'лиловый'] },
  { id: 'yellow', label: 'Жёлтый', hex: '#e8c547', keywords: ['жёлт', 'желт'] },
  { id: 'mix', label: 'Микс', hex: 'conic-gradient(from 0deg, #c0392b, #e8c547, #eb9fb4, #8e6bb0, #c0392b)', keywords: ['микс'] },
];

/** Only real color words already present in the composition text count —
 * nothing here guesses a color from a flower species. Most rows won't
 * match anything, which is expected until color gets written down too. */
export function productColors(p: NameDesc): string[] {
  const t = fullText(p);
  return COLOR_KEYWORDS.filter((c) => c.keywords.some((k) => t.includes(k))).map((c) => c.id);
}

export function colorLabel(id: string): { label: string; hex: string } | undefined {
  const c = COLOR_KEYWORDS.find((x) => x.id === id);
  return c ? { label: c.label, hex: c.hex } : undefined;
}

export const CATALOG_COLORS = COLOR_KEYWORDS.map(({ id, label, hex }) => ({ id, label, hex }));
