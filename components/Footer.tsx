export default function Footer() {
  return (
    <footer id="contacts">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <span className="brand-name">Sami Flowers</span>
            <p>Мастерская букетов и доставка цветов по Павлодару. Собираем из свежих поставок, согласовываем по фото.</p>
          </div>
          <div className="foot-col">
            <h4>Контакты</h4>
            <ul>
              <li>
                <a href="tel:+77761115319">+7 776 111 53 19</a>
              </li>
              <li>
                <a href="https://wa.me/77761115319" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="https://instagram.com/samiflowers_pvl" target="_blank" rel="noreferrer">
                  @samiflowers_pvl
                </a>
              </li>
              <li>
                <a href="https://go.2gis.com/blll3" target="_blank" rel="noreferrer">
                  Торайгырова, 73, 1 этаж
                </a>
              </li>
              <li>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Ежедневно 08:00–24:00</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Sami Flowers. Цветы для Павлодара.</span>
          <a href="https://go.2gis.com/blll3" target="_blank" rel="noreferrer">
            4,9 ★ · 483 отзыва на 2ГИС
          </a>
        </div>
      </div>
    </footer>
  );
}
