import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RIO',
    short_name: 'RIO',
    description: 'Aplicación de pedidos y gestión para RIO Laminado',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1216',
    theme_color: '#0d1216',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      }
    ],
  }
}
