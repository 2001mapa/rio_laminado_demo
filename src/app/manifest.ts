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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      }
    ],
  }
}
