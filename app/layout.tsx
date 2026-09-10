import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sami Flowers — доставка цветов в Павлодаре',
  description: 'Доставка свежих цветов по Павлодару — каталог букетов, подарки и заказ в WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,460;0,9..144,560;1,9..144,420;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
