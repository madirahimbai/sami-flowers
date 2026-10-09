'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/types';
import { buildOrderText } from '@/lib/order-text';
import { PICKUP_LOCATIONS, DELIVERY_ZONES, DELIVERY_TIME_SLOTS } from '@/lib/delivery';

export default function CartDrawer() {
  const { cart, removeFromCart, total, isCartOpen, closeCart, clearCart } = useCart();

  const [recipientType, setRecipientType] = useState<'self' | 'other'>('self');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'self' | 'courier'>('self');
  const [pickupIdx, setPickupIdx] = useState(0);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [comment, setComment] = useState('');

  // Freeze the page behind the open cart so it can't scroll or shift under it.
  useEffect(() => {
    if (!isCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isCartOpen]);

  const deliveryFee = deliveryMethod === 'courier' ? DELIVERY_ZONES[zoneIdx].price : 0;
  const grandTotal = total + deliveryFee;

  function buildPayload(branchIdx: number) {
    return {
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
      pickupAddress: deliveryMethod === 'self' ? PICKUP_LOCATIONS[branchIdx].label : undefined,
      deliveryZone: deliveryMethod === 'courier' ? DELIVERY_ZONES[zoneIdx].label : undefined,
      deliveryFee: deliveryMethod === 'courier' ? DELIVERY_ZONES[zoneIdx].price : undefined,
    };
  }

  function openWhatsAppWith(text: string, phone: string) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  // WhatsApp opens synchronously inside the click (browsers block pop-ups
  // opened after an await, and the button would sit "frozen" waiting on the
  // server). The order itself is recorded in the background — keepalive lets
  // the request finish even after the tab loses focus to WhatsApp.
  function checkout(branchIdx: number) {
    if (cart.length === 0) return;
    const payload = buildPayload(branchIdx);
    const text = buildOrderText(payload, cart);
    openWhatsAppWith(text, PICKUP_LOCATIONS[branchIdx].phone);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
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
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="ci-photo" src={item.image} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="ci-photo ci-photo-empty" />
                    )}
                    <div className="ci-main">
                      <div className="ci-name">{item.name}</div>
                      <div className="ci-meta">
                        {item.sizeLabel} · {formatPrice(item.price)} за шт · {item.qty} шт
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
                <span className="ct-label">Товары</span>
                <span className="ct-value">{formatPrice(total)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="cart-total">
                  <span className="ct-label">Доставка ({DELIVERY_ZONES[zoneIdx].label})</span>
                  <span className="ct-value">{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="cart-total">
                <span className="ct-label">Итого</span>
                <span className="ct-value">{formatPrice(grandTotal)}</span>
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

              <span className="field-label">Ваши контакты (необязательно — можно уточнить в WhatsApp)</span>
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
                  type="tel"
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
              <span className="field-label">
                {deliveryMethod === 'self' ? 'Пункт самовывоза' : 'Филиал (в какой WhatsApp написать)'}
              </span>
              <select
                className="cart-input"
                value={pickupIdx}
                onChange={(e) => setPickupIdx(Number(e.target.value))}
              >
                {PICKUP_LOCATIONS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label}
                  </option>
                ))}
              </select>
              {deliveryMethod === 'courier' && (
                <>
                  <select
                    className="cart-input"
                    style={{ marginTop: 8 }}
                    value={zoneIdx}
                    onChange={(e) => setZoneIdx(Number(e.target.value))}
                  >
                    {DELIVERY_ZONES.map((z, i) => (
                      <option key={z.label} value={i}>
                        {z.label} — {formatPrice(z.price)}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="cart-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Адрес доставки, ориентир"
                  />
                </>
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
                  {DELIVERY_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
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

              <span className="field-label">Выберите филиал — заказ откроется в WhatsApp, оплату обсудим там</span>
              <div className="wa-branch-list">
                {PICKUP_LOCATIONS.map((p, i) => (
                  <button
                    key={p.label}
                    className="btn btn-primary wa-branch-btn"
                    type="button"
                    onClick={() => checkout(i)}
                  >
                    <span className="wb-name">{p.label}</span>
                    <span className="wb-total">{formatPrice(grandTotal)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
