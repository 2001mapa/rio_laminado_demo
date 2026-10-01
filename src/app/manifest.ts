import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RIO B2B Pedidos',
    short_name: 'RIO B2B',
    description: 'Aplicación de pedidos y gestión para RIO Laminado',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2c3e50',
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
