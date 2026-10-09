import type { Metadata } from 'next';
import { listRecentOrders } from '@/lib/db';
import { formatPrice } from '@/lib/order-text';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Заказы с сайта',
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Almaty',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function OrdersPage() {
  const orders = await listRecentOrders(100);
  const failed = orders.filter((o) => !o.telegram_ok).length;

  return (
    <div className="av-wrap">
      <header className="av-head">
        <div className="av-head-top">
          <h1>Заказы с сайта</h1>
          <div className="av-head-links">
            <a href="/admin/dashboard">Админка</a>
          </div>
        </div>
        <p className="av-count">
          Последние {orders.length}. Не дошли в Telegram: <strong>{failed}</strong>
          {failed > 0 ? ' — отправятся повторно автоматически' : ''}
        </p>
      </header>

      {orders.length === 0 ? (
        <p className="av-empty">Заказов пока нет.</p>
      ) : (
        <ul className="av-list">
          {orders.map((o) => (
            <li key={o.id} className="od-row">
              <div className="od-top">
                <span className="od-time">{dateFmt.format(new Date(o.created_at))}</span>
                <span className="od-total">{formatPrice(o.total)}</span>
                <span className={`od-badge ${o.telegram_ok ? 'is-ok' : 'is-fail'}`}>
                  {o.telegram_ok ? 'В Telegram доставлен' : 'Не дошёл в Telegram'}
                </span>
              </div>
              {!o.telegram_ok && o.telegram_error && <div className="od-error">{o.telegram_error}</div>}
              <details>
                <summary>Состав заказа</summary>
                <pre className="od-text">{o.text}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
