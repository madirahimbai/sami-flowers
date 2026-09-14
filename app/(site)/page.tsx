import { listProducts } from '@/lib/db';
import CatalogClient from '@/components/CatalogClient';
import { WORKING_HOURS } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await listProducts();

  return (
    <main id="top">
      <section className="hero wrap" style={{ paddingTop: 20 }}>
        <div className="hero-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="hero-copy">
            <span className="eyebrow">Доставка цветов · Павлодар</span>
            <h1>Доставка цветов в Павлодаре</h1>
            <p className="lede">
              Дарим счастливые моменты — свежие букеты и розы из мастерских на Торайгырова и Амангельды, доставка
              по Павлодару и самовывоз в день заказа. Перед отправкой присылаем фото букета в WhatsApp, чтобы вы
              видели именно то, что получит адресат.
            </p>
            <div className="hero-actions">
              <a
                className="btn btn-primary"
                href="https://wa.me/77761115319?text=Здравствуйте!%20Хочу%20заказать%20букет"
                target="_blank"
                rel="noreferrer"
              >
                Написать в WhatsApp
              </a>
              <a className="btn btn-ghost" href="/roses">
                Смотреть розы
              </a>
            </div>
          </div>
        </div>
      </section>

      <CatalogClient products={products} />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap info-page" style={{ paddingTop: 0 }}>
          <h2>Как выбрать и заказать букет</h2>
          <p>
            В каталоге — букеты, розы и подарки к ним (конфеты, открытки, бенто-торты). Выберите товар, при
            необходимости измените размер букета, добавьте его в корзину и укажите способ получения — курьером по
            Павлодару или самовывозом из одного из двух магазинов. Заказ подтверждается в WhatsApp, там же можно
            уточнить состав или пожелания к букету.
          </p>

          <h2>Доставка и самовывоз</h2>
          <p>
            Доставляем по Павлодару {WORKING_HOURS.toLowerCase()}, стоимость зависит от района. Самовывоз — на
            Торайгырова, 73 и Амангельды, 23, в те же часы. Полные условия, зоны доставки и способы оплаты — на
            странице <a href="/delivery">«Доставка и оплата»</a>.
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
