import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff8f6',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: '#a8324c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 68,
            fontWeight: 700,
            color: '#fff8f6',
            marginBottom: 36,
          }}
        >
          S
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#221f20' }}>Sami Flowers</div>
        <div style={{ display: 'flex', fontSize: 30, color: '#872840', marginTop: 18 }}>
          Доставка цветов в Павлодаре
        </div>
      </div>
    ),
    { ...size }
  );
}
