import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#a8324c',
          borderRadius: 14,
          fontSize: 38,
          fontWeight: 700,
          color: '#fff8f6',
          fontFamily: 'sans-serif',
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
