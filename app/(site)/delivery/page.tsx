import type { Metadata } from 'next';
import Breadcrumbs, { breadcrumbSchema } from '@/components/Breadcrumbs';
import { PICKUP_LOCATIONS, KASPI_LINK, DELIVERY_ZONES, WORKING_HOURS, formatPhone } from '@/lib/delivery';

const SITE_URL = 'https://www.samiflowers.kz';
const DESCRIPTION =
  'Условия доставки цветов по Павлодару: районы и стоимость, самовывоз с Торайгырова и Амангельды, оплата Kaspi Gold и картой через PayPal.';

export const metadata: Metadata = {
  title: 'Доставка и оплата цветов в Павлодаре',
  description: DESCRIPTION,
  alternates: { canonical: '/delivery' },
  openGraph: {
    title: 'Доставка и оплата цветов в Павлодаре',
    description: DESCRIPTION,
    url: `${SITE_URL}/delivery`,
  },
};

const crumbs = [
  { label: 'Главная', href: '/' },
  { label: 'Доставка и оплата' },
];

export default function DeliveryPage() {
  const schema = breadcrumbSchema(crumbs);

  return (
    <main className="info-page wrap">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={crumbs} />
      <h1>Доставка и оплата цветов в Павлодаре</h1>
      <p className="lede">
        Собираем букет в день заказа и доставляем курьером по Павлодару или отдаём на самовывоз в одном из двух
        магазинов. Перед отправкой присылаем фото готового букета в WhatsApp.
      </p>

      <h2>Стоимость доставки по районам</h2>
      <table className="info-table">
        <thead>
          <tr>
            <th>Район</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {DELIVERY_ZONES.map((z) => (
            <tr key={z.label}>
              <td>{z.label}</td>
              <td>{z.price.toLocaleString('ru-RU')} ₸</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Работаем {WORKING_HOURS.toLowerCase()}. Точное время доставки согласуем в переписке после оформления заказа.</p>

      <h2>Самовывоз</h2>
      <div className="info-cards">
        {PICKUP_LOCATIONS.map((p) => (
          <div className="info-card" key={p.label}>
            <h3>{p.label}</h3>
            <p>{WORKING_HOURS}</p>
            <p>
              <a href={`tel:+${p.phone}`}>{formatPhone(p.phone)}</a>
            </p>
          </div>
        ))}
      </div>

      <h2>Способы оплаты</h2>
      <ul>
        <li>
          <strong>Kaspi Gold</strong> — оплата по ссылке{' '}
          <a href={KASPI_LINK} target="_blank" rel="noreferrer">
            pay.kaspi.kz
          </a>
          .
        </li>
        <li>
          <strong>PayPal</strong> — оплата картой на сайте, сумма списывается в долларах по текущему курсу.
        </li>
        <li>Наличными или переводом курьеру при получении — способ уточняем в переписке.</li>
      </ul>

      <h2>Как оформить заказ</h2>
      <p>
        Выберите букет в <a href="/#catalog">каталоге</a> или среди <a href="/roses">роз</a>, добавьте его в
        корзину, укажите способ получения и контакты. Дальше заказ подтверждается в WhatsApp — там же можно
        уточнить состав, заменить цветы по сезону или обсудить открытку к букету.
      </p>
    </main>
  );
}
