import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://www.samiflowers.kz';
const SITE_NAME = 'Sami Flowers';
const DESCRIPTION =
  'Доставка свежих цветов и букетов по Павлодару за 60 минут. Каталог букетов, подарки, самовывоз с Торайгырова и Амангельды, заказ в WhatsApp. Рейтинг 4,9 ★ на 2ГИС.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sami Flowers — доставка цветов в Павлодаре',
    template: '%s — Sami Flowers',
  },
  description: DESCRIPTION,
  keywords: [
    'доставка цветов Павлодар',
    'купить букет Павлодар',
    'цветы Павлодар',
    'заказать цветы Павлодар',
    'флорист Павлодар',
    'букет на заказ Павлодар',
    'доставка цветов Казахстан',
    'Sami Flowers',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Sami Flowers — доставка цветов в Павлодаре',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sami Flowers — доставка цветов в Павлодаре',
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  name: 'Sami Flowers',
  description: DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/logo.svg`,
  telephone: ['+77761115319', '+77076828707'],
  priceRange: '₸₸',
  address: [
    {
      '@type': 'PostalAddress',
      streetAddress: 'Торайгырова, 73',
      addressLocality: 'Павлодар',
      addressCountry: 'KZ',
    },
    {
      '@type': 'PostalAddress',
      streetAddress: 'Амангельды, 23',
      addressLocality: 'Павлодар',
      addressCountry: 'KZ',
    },
  ],
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '23:59',
  },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
