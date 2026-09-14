import type { Metadata } from 'next';
import { listProducts } from '@/lib/db';
import { isRoseProduct } from '@/lib/roses';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs, { breadcrumbSchema } from '@/components/Breadcrumbs';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.samiflowers.kz';
const DESCRIPTION =
  'Розы с доставкой по Павлодару — от компактных букетов до эффектных из 51 и 101 розы. Заказ в WhatsApp, самовывоз с Торайгырова и Амангельды.';

export const metadata: Metadata = {
  title: 'Розы с доставкой в Павлодаре — купить букет роз',
  description: DESCRIPTION,
  alternates: { canonical: '/roses' },
  openGraph: {
    title: 'Розы с доставкой в Павлодаре',
    description: DESCRIPTION,
    url: `${SITE_URL}/roses`,
  },
};

const crumbs = [
  { label: 'Главная', href: '/' },
  { label: 'Розы' },
];

export default async function RosesPage() {
  const bouquets = await listProducts('bouquet');
  const roses = bouquets.filter((p) => p.available && isRoseProduct(p));

  const schema = breadcrumbSchema(crumbs);

  return (
    <main className="info-page wrap">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={crumbs} />
      <h1>Розы с доставкой в Павлодаре</h1>
      <p className="lede">
        Розы поштучно и в готовых букетах — классические и кустовые, из Эквадора и Кении. В каталоге есть как
        компактные варианты, так и объёмные букеты на 51 и 101 розу. Собираем в день заказа и отправляем фото
        букета в WhatsApp перед отправкой.
      </p>

      {roses.length === 0 ? (
        <p>Сейчас собираем новую поставку роз — загляните чуть позже или уточните наличие в WhatsApp.</p>
      ) : (
        <div className="catalog-grid" style={{ marginTop: 28 }}>
          {roses.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}

      <h2>Как заказать розы</h2>
      <p>
        Выберите букет, при желании измените размер (Стандарт, 1.5х, 2х или 3х) и добавьте его в корзину. При
        оформлении укажите способ получения — самовывоз или доставку — и подтвердите заказ в WhatsApp. Подробные
        условия доставки и оплаты — на странице{' '}
        <a href="/delivery">«Доставка и оплата»</a>.
      </p>
    </main>
  );
}
