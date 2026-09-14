/** Single source of truth for branch addresses/phones and delivery zones —
 * used by the cart, header contact popovers, and the /delivery, /contacts
 * pages, so name/phone/price data can't drift out of sync between them. */
export const PICKUP_LOCATIONS = [
  { label: 'Торайгырова, 73', phone: '77761115319' },
  { label: 'Амангельды, 23', phone: '77076828707' },
];

export const KASPI_LINK = 'https://pay.kaspi.kz/pay/ucljnkfw';

export const DELIVERY_ZONES = [
  { label: 'По городу', price: 1500 },
  { label: 'Аксу', price: 6500 },
  { label: 'Жетекши', price: 3000 },
  { label: 'Кенжеколь', price: 2500 },
  { label: 'Ленинский, Мойылды, Павлодарское', price: 3500 },
  { label: 'Лесозавод, Аквилон, загород', price: 1500 },
];

export const WORKING_HOURS = 'Ежедневно с 08:00 до 24:00';

/** "77761115319" -> "+7 776 111 53 19" */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

// Hourly slots covering working hours 08:00–00:00 — used for both courier
// delivery and pickup, since staff can commit to an hour at either.
export const DELIVERY_TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const fmt = (h: number) => `${(h % 24).toString().padStart(2, '0')}:00`;
  return `${fmt(8 + i)}–${fmt(9 + i)}`;
});
