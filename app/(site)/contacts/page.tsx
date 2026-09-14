import type { Metadata } from 'next';
import Breadcrumbs, { breadcrumbSchema } from '@/components/Breadcrumbs';
import { PICKUP_LOCATIONS, WORKING_HOURS, formatPhone } from '@/lib/delivery';

const SITE_URL = 'https://www.samiflowers.kz';
const DESCRIPTION =
  'Магазины цветов Sami Flowers в Павлодаре: Торайгырова, 73 и Амангельды, 23. Телефоны, режим работы, самовывоз и маршрут на карте.';

export const metadata: Metadata = {
  title: 'Контакты и магазины Sami Flowers в Павлодаре',
  description: DESCRIPTION,
  alternates: { canonical: '/contacts' },
  openGraph: {
    title: 'Контакты и магазины Sami Flowers в Павлодаре',
    description: DESCRIPTION,
    url: `${SITE_URL}/contacts`,
  },
};

const crumbs = [
  { label: 'Главная', href: '/' },
  { label: 'Контакты' },
];

const SHOP_LINKS: Record<string, string> = {
  'Торайгырова, 73': 'https://go.2gis.com/blll3',
};

const SHOP_SLUGS: Record<string, string> = {
  'Торайгырова, 73': 'toraigyrov',
  'Амангельды, 23': 'amangeldy',
};

function shopSchema(p: { label: string; phone: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Florist',
    '@id': `${SITE_URL}/contacts#${SHOP_SLUGS[p.label] ?? p.label}`,
    name: `Sami Flowers — ${p.label}`,
    url: `${SITE_URL}/contacts`,
    telephone: `+${p.phone}`,
    priceRange: '₸₸',
    address: {
      '@type': 'PostalAddress',
      streetAddress: p.label,
      addressLocality: 'Павлодар',
      addressCountry: 'KZ',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '23:59',
    },
  };
}

export default function ContactsPage() {
  const breadcrumb = breadcrumbSchema(crumbs);

  return (
    <main className="info-page wrap">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {PICKUP_LOCATIONS.map((p) => (
        <script
          key={p.label}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(shopSchema(p)) }}
        />
      ))}

      <Breadcrumbs items={crumbs} />
      <h1>Контакты и магазины Sami Flowers</h1>
      <p className="lede">Дарим счастливые моменты — свяжитесь с нами или приезжайте в один из магазинов в Павлодаре.</p>

      <div className="info-cards">
        {PICKUP_LOCATIONS.map((p) => (
          <div className="info-card" key={p.label}>
            <h3>{p.label}</h3>
            <p>{WORKING_HOURS}</p>
            <p>
              <a href={`tel:+${p.phone}`}>{formatPhone(p.phone)}</a>
            </p>
            <p>
              <a
                href={`https://wa.me/${p.phone}?text=${encodeURIComponent('Здравствуйте! Хочу заказать букет')}`}
                target="_blank"
                rel="noreferrer"
              >
                Написать в WhatsApp
              </a>
            </p>
            {SHOP_LINKS[p.label] && (
              <p>
                <a href={SHOP_LINKS[p.label]} target="_blank" rel="noreferrer">
                  Маршрут на 2ГИС
                </a>
              </p>
            )}
          </div>
        ))}
      </div>

      <h2>Другие способы связи</h2>
      <ul>
        <li>
          Instagram —{' '}
          <a href="https://instagram.com/samiflowers_pvl" target="_blank" rel="noreferrer">
            @samiflowers_pvl
          </a>
        </li>
        <li>
          Отзывы — <a href="https://go.2gis.com/blll3" target="_blank" rel="noreferrer">4,9 ★, 483 отзыва на 2ГИС</a>
        </li>
      </ul>

      <p>
        Условия доставки и оплаты — на странице <a href="/delivery">«Доставка и оплата»</a>.
      </p>
    </main>
  );
}
