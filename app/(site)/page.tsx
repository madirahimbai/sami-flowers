import { listProducts, listCategories } from '@/lib/db';
import CatalogClient from '@/components/CatalogClient';
import { WORKING_HOURS } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);

  return (
    <main id="top">
      <CatalogClient products={products} categories={categories} />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap info-page" style={{ paddingTop: 0 }}>
          <h2>Как выбрать и заказать букет</h2>
          <p>
            В каталоге — букеты, розы и подарки к ним (конфеты, открытки, бенто-торты). Выберите товар, добавьте
            его в корзину и укажите способ получения — курьером по Павлодару или самовывозом из одного из двух
            магазинов. Заказ подтверждается в WhatsApp, там же можно уточнить состав или пожелания к букету.
          </p>

          <h2>Доставка и самовывоз</h2>
          <p>
            Быстрая доставка по Павлодару в течение 60 минут — работаем {WORKING_HOURS.toLowerCase()}, стоимость
            зависит от района. Самовывоз — на Торайгырова, 73 и Амангельды, 23, в те же часы. Полные условия, зоны
            доставки и способы оплаты — на странице <a href="/delivery">«Доставка и оплата»</a>.
          </p>

          <h2>Что в каталоге</h2>
          <p>
            Классические и кустовые розы (в том числе крупные букеты на 51 и 101 розу), сезонные авторские букеты,
            цветы в коробках и подарочные наборы. Отдельная подборка роз — на странице <a href="/roses">«Розы»</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
