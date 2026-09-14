import Link from 'next/link';

export type Crumb = { label: string; href?: string };

const SITE_URL = 'https://www.samiflowers.kz';

/** Renders visible breadcrumb navigation and returns matching BreadcrumbList
 * JSON-LD via `breadcrumbSchema()` — call both together so the visible trail
 * and the structured data never drift apart. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, i) => (
          <li key={i}>
            {item.href && i !== items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbSchema(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : undefined,
    })),
  };
}
