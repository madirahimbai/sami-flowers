import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://www.samiflowers.kz';
const SITE_NAME = 'Sami Flowers';
const DESCRIPTION =
  'Доставка цветов и букетов по Павлодару в день заказа. Каталог букетов и роз, самовывоз с Торайгырова и Амангельды, заказ в WhatsApp. Рейтинг 4,9 ★ на 2ГИС.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Доставка цветов в Павлодаре — купить букет | Sami Flowers',
    template: '%s — Sami Flowers',
  },
  description: DESCRIPTION,
  keywords: [
    'доставка цветов Павлодар',
    'купить цветы Павлодар',
    'цветы Павлодар',
    'цветочный магазин Павлодар',
    'заказать букет Павлодар',
    'доставка букетов Павлодар',
    'розы Павлодар',
    'купить розы Павлодар',
    'доставка роз Павлодар',
    'Sami Flowers',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Доставка цветов в Павлодаре — купить букет | Sami Flowers',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Доставка цветов в Павлодаре — купить букет | Sami Flowers',
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

// Site-wide Organization entity. The two physical shops each get their own
// Florist entity with a stable @id on /contacts, next to their visible
// address/phone — see components rendered there. Keeping address data out
// of this shared entity avoids the "one LocalBusiness, many addresses"
// anti-pattern.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  alternateName: 'Sami Flowers — Дарим счастливые моменты',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '483',
  },
  sameAs: ['https://instagram.com/samiflowers_pvl', 'https://go.2gis.com/blll3'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,460;0,9..144,560;1,9..144,420;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
