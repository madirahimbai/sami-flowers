'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/types';

const PICKUP_LOCATIONS = [
  { label: 'Торайгырова, 73, 1 этаж', phone: '77761115319' },
  { label: 'Амангельды, 23', phone: '77076828707' },
];

const KASPI_LINK = 'https://pay.kaspi.kz/pay/ucljnkfw';

// Hourly slots covering working hours 08:00–00:00 — used for both courier
// delivery and pickup, since staff can commit to an hour at either.
const DELIVERY_TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const fmt = (h: number) => `${(h % 24).toString().padStart(2, '0')}:00`;
  return `${fmt(8 + i)}–${fmt(9 + i)}`;
});

export default function CartDrawer() {
  const { cart, removeFromCart, total, isCartOpen, closeCart, clearCart } = useCart();

  const [recipientType, setRecipientType] = useState<'self' | 'other'>('self');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'self' | 'courier'>('self');
  const [pickupIdx, setPickupIdx] = useState(0);
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPaypal, setShowPaypal] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);

  function validateContact(): boolean {
    const phoneDigits = orderPhone.replace(/\D/g, '');
    if (!orderName.trim() || phoneDigits.length < 10) {
      setFormError('Укажите имя и телефон — без них мы не сможем связаться и подтвердить заказ');
      return false;
    }
    setFormError('');
    return true;
  }

  function buildPayload() {
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
      pickupAddress: deliveryMethod === 'self' ? PICKUP_LOCATIONS[pickupIdx].label : undefined,
    };
  }

  function openWhatsAppWith(text: string) {
    const targetPhone = deliveryMethod === 'self' ? PICKUP_LOCATIONS[pickupIdx].phone : PICKUP_LOCATIONS[0].phone;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  // The PayPal button below is mounted once and stays on screen while the
  // customer can still edit the form — read through this ref (refreshed
  // every render) so createOrder/onApprove always see the latest total and
  // form fields instead of whatever was current when the button first
  // rendered.
  const latestRef = useRef({ total, buildPayload, openWhatsAppWith });
  latestRef.current = { total, buildPayload, openWhatsAppWith };

  async function checkout() {
    if (cart.length === 0) return;
    if (!validateContact()) return;
    setSending(true);
    let waText = '';
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      waText = data.message || '';
    } catch {
      // fall through — still let the customer reach WhatsApp even if our
      // own Telegram-notify call failed
    }
    setSending(false);
    if (waText) openWhatsAppWith(waText);
    clearCart();
    closeCart();
  }

  // Loads the PayPal JS SDK (once) and renders the official PayPal button
  // only after the customer opts in — keeps it off the initial page load.
  useEffect(() => {
    if (!showPaypal || !paypalRef.current) return;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setFormError('Оплата PayPal ещё не настроена — выберите другой способ.');
      setShowPaypal(false);
      return;
    }

    function renderButtons() {
      const container = paypalRef.current;
      const paypal = (window as any).paypal;
      if (!container || !paypal) return;
      container.replaceChildren(); // clear any previously-rendered button, no markup involved
      paypal
        .Buttons({
          style: { layout: 'horizontal', height: 40 },
          createOrder: async () => {
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ totalKzt: latestRef.current.total }),
            });
            const data = await res.json();
            if (!data.orderId) throw new Error('create_order_failed');
            return data.orderId;
          },
          onApprove: async (data: { orderID: string }) => {
            setSending(true);
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID, ...latestRef.current.buildPayload() }),
              });
              const result = await res.json();
              if (result.ok) {
                latestRef.current.openWhatsAppWith(result.message);
                clearCart();
                closeCart();
              } else {
                setFormError('Оплата не прошла. Попробуйте ещё раз или выберите другой способ.');
              }
            } finally {
              setSending(false);
            }
          },
          onError: () => setFormError('Ошибка PayPal — попробуйте ещё раз или выберите другой способ.'),
        })
        .render(container);
    }

    if ((window as any).paypal) {
      renderButtons();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = renderButtons;
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaypal]);

  function togglePaypal() {
    if (!showPaypal && !validateContact()) return;
    setShowPaypal((v) => !v);
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

              <span className="field-label">Ваши контакты — как к вам обращаться и куда позвонить *</span>
              <div className="field-row">
                <input
                  className={`cart-input ${formError && !orderName.trim() ? 'has-error' : ''}`}
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  placeholder="Ваше имя"
                  required
                />
                <input
                  className={`cart-input ${formError && orderPhone.replace(/\D/g, '').length < 10 ? 'has-error' : ''}`}
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  placeholder="Ваш телефон"
                  type="tel"
                  required
                />
              </div>
              {formError && <p className="cart-error">{formError}</p>}

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
                <select
                  className="cart-input"
                  style={{ marginTop: 8 }}
                  value={pickupIdx}
                  onChange={(e) => setPickupIdx(Number(e.target.value))}
                >
                  {PICKUP_LOCATIONS.map((p, i) => (
                    <option key={p.label} value={i}>
                      Самовывоз: Павлодар, {p.label}
                    </option>
                  ))}
                </select>
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

              <span className="field-label">Способ оплаты</span>
              <div className="pay-methods">
                <a className="pay-method" href={KASPI_LINK} target="_blank" rel="noreferrer">
                  <svg className="icon" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="3" />
                    <path d="M2 10h20" />
                  </svg>
                  Kaspi Gold
                </a>
                <button type="button" className={`pay-method ${showPaypal ? 'is-active' : ''}`} onClick={togglePaypal}>
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M6 4h10a5 5 0 010 10H10l-1.5 6H4z" />
                  </svg>
                  PayPal
                </button>
              </div>
              <p className="pp-demo-note" style={{ fontSize: 12, marginTop: 6 }}>
                Kaspi: оплатите по ссылке, затем нажмите «Оформить в WhatsApp» ниже. PayPal: оплата картой сразу здесь
                (списывается в долларах по курсу).
              </p>
              {showPaypal && <div ref={paypalRef} style={{ marginTop: 10, minHeight: 44 }} />}

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
