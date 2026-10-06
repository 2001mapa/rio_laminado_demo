import { ImageResponse } from 'next/og';

export const alt = 'RIO — Catálogo exclusivo para mayoristas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1216', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 70 }}>
        <div style={{ display: 'flex', width: 350, height: 350, borderRadius: 175, background: '#fff', color: '#000', alignItems: 'center', justifyContent: 'center', fontSize: 136, fontFamily: 'Arial, sans-serif', letterSpacing: -8 }}>
          RIO
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 570, gap: 18 }}>
          <div style={{ fontSize: 30, letterSpacing: 9, color: '#d1d5db' }}>RIO</div>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.08 }}>Catálogo exclusivo para mayoristas</div>
          <div style={{ width: 110, height: 5, background: '#b58b38', marginTop: 8 }} />
        </div>
      </div>
    </div>,
    size,
  );
}
