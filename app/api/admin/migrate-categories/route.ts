import { NextRequest, NextResponse } from 'next/server';
import { listProductsFull, upsertCategory, upsertProduct } from '@/lib/db';
import { isRose, isBushRose, isMono, isAssorted, isExotic, isBoxArrangement } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES = [
  { id: 'roses', label: 'Розы', sort_order: 1, test: isRose },
  { id: 'bush_roses', label: 'Кустовые розы', sort_order: 2, test: isBushRose },
  { id: 'mono', label: 'Монобукеты', sort_order: 3, test: isMono },
  { id: 'assorted', label: 'Сборные букеты', sort_order: 4, test: isAssorted },
  { id: 'exotic', label: 'Экзотика', sort_order: 5, test: isExotic },
  { id: 'box', label: 'Цветы в коробках', sort_order: 6, test: isBoxArrangement },
];

/**
 * One-time bootstrap for the admin-managed category system: creates the six
 * starting categories (safe to re-run — upsertCategory just updates the
 * label if they already exist), then, ONLY for products that don't have any
 * category_tags yet, assigns tags using the same composition-text heuristics
 * the catalog used to filter with automatically. Products the admin has
 * already tagged (via the dashboard) are left untouched, so this can't
 * clobber manual corrections.
 *
 * Usage: POST /api/admin/migrate-categories  with header  x-setup-secret: <TELEGRAM_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-setup-secret');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  for (const c of DEFAULT_CATEGORIES) {
    await upsertCategory({ id: c.id, label: c.label, sort_order: c.sort_order });
  }

  const products = await listProductsFull('bouquet');
  let tagged = 0;
  const results: { id: string; name: string; tags: string[] }[] = [];

  for (const p of products) {
    if (p.category_tags && p.category_tags.length > 0) continue; // already tagged — don't override
    const tags = DEFAULT_CATEGORIES.filter((c) => c.test(p)).map((c) => c.id);
    if (tags.length === 0) continue;
    await upsertProduct({
      id: p.id,
      name: p.name,
      number: p.number,
      price: p.price,
      description: p.description,
      image: p.image,
      category: p.category,
      category_tags: tags,
      tag: p.tag,
      available: p.available,
      sort_order: p.sort_order,
    });
    tagged++;
    results.push({ id: p.id, name: p.name, tags });
  }

  return NextResponse.json({ ok: true, categories_created: DEFAULT_CATEGORIES.length, products_tagged: tagged, results });
}
