import { listProducts } from '@/lib/db';
import CatalogClient from '@/components/CatalogClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await listProducts();

  return (
    <main id="top">
      <section className="hero wrap">
        <div className="hero-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="hero-copy">
            <span className="eyebrow">Доставка цветов · Павлодар</span>
            <h1>Букет собирают, пока вы дочитываете это предложение</h1>
            <p className="lede">
              Свежие цветы из мастерской на Торайгырова — в любой микрорайон Павлодара от 90 минут. Перед отправкой
              присылаем фото букета, чтобы вы видели именно то, что получит адресат.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#catalog">
                Смотреть каталог
              </a>
              <a
                className="btn btn-ghost"
                href="https://wa.me/77761115319?text=Здравствуйте!%20Хочу%20заказать%20букет"
                target="_blank"
                rel="noreferrer"
              >
                Написать в WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <CatalogClient products={products} />
    </main>
  );
}
