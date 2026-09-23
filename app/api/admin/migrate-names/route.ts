import { NextRequest, NextResponse } from 'next/server';
import { listProductsFull, updateProductNaming } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CODE_PATTERN = /^Букет\s+(\S+)$/i;

function extractArticle(name: string): number | null {
  const trimmed = name.trim();
  const m = trimmed.match(CODE_PATTERN);
  const code = m ? m[1] : trimmed;
  return /^\d+$/.test(code) ? parseInt(code, 10) : null;
}

// "ЭУСТОМА" -> "Эустома" — an all-caps word reads as a data-entry habit, not
// intentional emphasis, and looks wrong sitting in a customer-facing title.
function normalizeWord(w: string): string {
  if (w.length > 1 && w === w.toUpperCase() && w !== w.toLowerCase()) {
    return w[0] + w.slice(1).toLowerCase();
  }
  return w;
}

function buildNameFromDescription(description: string): string {
  return description
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map((line) => line.split(' ').map(normalizeWord).join(' '))
    .join(' + ');
}

/**
 * One-time cleanup: splits the current "Букет 5820"-style name into a real
 * article number (into `number`, previously unused) and a customer-facing
 * name built from the composition an admin already typed into
 * `description` — e.g. "Букет 8490" + "Белая роза 51 стебель" becomes
 * name "Белая роза 51 стебель", article 8490.
 *
 * Never invents a variety: a product with no description, or whose name
 * doesn't match the expected "Букет NNNN" / bare-number pattern, keeps its
 * current name untouched and is reported back for manual follow-up.
 * Idempotent — skips any row that already has `number` set, so re-running
 * is safe.
 *
 * Usage: POST /api/admin/migrate-names  with header  x-setup-secret: <TELEGRAM_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-setup-secret');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 401 });
  }

  const products = await listProductsFull('bouquet');
  const renamed: { id: string; from: string; to: string; article: number }[] = [];
  const articleOnly: { id: string; name: string; article: number }[] = [];
  const needsReview: { id: string; name: string; reason: string }[] = [];

  for (const p of products) {
    if (p.number !== null) continue; // already migrated or manually set — don't clobber

    const article = extractArticle(p.name);
    if (article === null) {
      needsReview.push({ id: p.id, name: p.name, reason: 'название не в формате "Букет NNNN"' });
      continue;
    }

    const description = (p.description || '').trim();
    if (!description) {
      await updateProductNaming(p.id, p.name, article);
      articleOnly.push({ id: p.id, name: p.name, article });
      needsReview.push({ id: p.id, name: p.name, reason: 'нет описания состава — название не менялось' });
      continue;
    }

    const newName = buildNameFromDescription(description);
    await updateProductNaming(p.id, newName, article);
    renamed.push({ id: p.id, from: p.name, to: newName, article });
  }

  return NextResponse.json({
    ok: true,
    renamed_count: renamed.length,
    article_only_count: articleOnly.length,
    needs_review_count: needsReview.length,
    renamed,
    needs_review: needsReview,
  });
}
