import { isRose } from './catalog';

/** Kept as a thin alias — `lib/catalog.ts` now owns all the composition-text
 * heuristics (roses included), so this file just re-exports under the name
 * existing pages already import. */
export const isRoseProduct = isRose;
