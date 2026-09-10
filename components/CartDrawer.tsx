'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/types';

const WHATSAPP_NUMBER = '77761115319';

export default function CartDrawer() {
  const { cart, removeFromCart, total, isCartOpen, closeCart, clearCart } = useCart();

  const [recipientType, setRecipientType] = useState<'self' | 'other'>('self');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'self' | 'courier'>('self');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  async function checkout() {
    if (cart.length === 0) return;
    setSending(true);
    const payload = {
      items: cart,
      recipientType,
      recipientName,
      recipientPhone,
      orderName,
      orderPhone,
      deliveryMethod,
      address,
      deliveryDate,
      deliveryTime,
      cardMessage,
      comment,
    };
    let waText = '';
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      waText = data.message || '';
    } catch {
      // fall through — still let the customer reach WhatsApp even if our
      // own Telegram-notify call failed
    }
    setSending(false);
    if (waText) {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`, '_blank');
    }
    clearCart();
    closeCart();
  }

  if (!isCartOpen) return null;

  return (
    <div className="sheet-overlay open" onClick={(e) => e.target === e.currentTarget && closeCart()}>
      <div className="sheet" style={{ maxWidth: 480 }}>
        <button className="sheet-close" type="button" aria-label="Закрыть" onClick={closeCart}>
          ×
        </button>
        <div className="cart-body">
          <h3>Корзина</h3>

          {cart.length === 0 ? (
            <div className="cart-empty">Корзина пуста — выберите букет в каталоге.</div>
          ) : (
            <>
              <div>
                {cart.map((item, idx) => (
                  <div className="cart-item" key={idx}>
                    <div>
                      <div className="ci-name">{item.name}</div>
                      <div className="ci-meta">
                        {item.sizeLabel} · {item.qty} шт
                      </div>
                      <button className="ci-remove" type="button" onClick={() => removeFromCart(idx)}>
                        Убрать
                      </button>
                    </div>
                    <div className="ci-price">{formatPrice(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <span className="ct-label">Итого</span>
                <span className="ct-value">{formatPrice(total)}</span>
              </div>

              <span className="field-label">Букет получит</span>
              <div className="delivery-toggle">
                <button
                  type="button"
                  className={`delivery-opt ${recipientType === 'self' ? 'is-active' : ''}`}
                  onClick={() => setRecipientType('self')}
                >
                  Себе
                </button>
                <button
                  type="button"
                  className={`delivery-opt ${recipientType === 'other' ? 'is-active' : ''}`}
                  onClick={() => setRecipientType('other')}
                >
                  Другому человеку
                </button>
              </div>
              {recipientType === 'other' && (
                <div>
                  <span className="field-label">Имя получателя</span>
                  <input
                    className="cart-input"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Как зовут получателя"
                  />
                  <span className="field-label">Телефон получателя</span>
                  <input
                    className="cart-input"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+7 7__ ___ __ __"
                  />
                </div>
              )}

              <span className="field-label">Ваши контакты</span>
              <div className="field-row">
                <input
                  className="cart-input"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  placeholder="Ваше имя"
                />
                <input
                  className="cart-input"
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  placeholder="Ваш телефон"
                />
              </div>

              <span className="field-label">Способ получения</span>
              <div className="delivery-toggle">
                <button
                  type="button"
                  className={`delivery-opt ${deliveryMethod === 'self' ? 'is-active' : ''}`}
                  onClick={() => setDeliveryMethod('self')}
                >
                  Самовывоз
                </button>
                <button
                  type="button"
                  className={`delivery-opt ${deliveryMethod === 'courier' ? 'is-active' : ''}`}
                  onClick={() => setDeliveryMethod('courier')}
                >
                  Доставка
                </button>
              </div>
              {deliveryMethod === 'courier' ? (
                <textarea
                  className="cart-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Адрес доставки, ориентир"
                />
              ) : (
                <p className="pp-demo-note" style={{ marginTop: 8, fontSize: 12.5 }}>
                  Самовывоз: Павлодар, Торайгырова, 73, 1 этаж
                </p>
              )}
              <div className="field-row" style={{ marginTop: 10 }}>
                <input
                  className="cart-input"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
                <select
                  className="cart-input"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                >
                  <option value="">Время — как можно скорее</option>
                  <option value="12:00–15:00">12:00–15:00</option>
                  <option value="15:00–18:00">15:00–18:00</option>
                  <option value="18:00–21:00">18:00–21:00</option>
                  <option value="Уточню в переписке">Уточню в переписке</option>
                </select>
              </div>

              <span className="field-label">Текст на открытке</span>
              <textarea
                className="cart-address"
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Что написать на открытке (необязательно)"
              />

              <span className="field-label">Комментарий к заказу</span>
              <textarea
                className="cart-address"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Любые пожелания (необязательно)"
              />

              <button className="btn btn-primary cart-checkout-btn" type="button" onClick={checkout} disabled={sending}>
                {sending ? 'Отправляем…' : 'Оформить в WhatsApp'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
