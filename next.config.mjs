import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
  cacheStartUrl: false,
  dynamicStartUrl: false,
  fallbacks: {
    document: "/offline",
  },
  customWorkerDir: "worker", // Explicit custom worker
  workboxOptions: {
    disableDevLogs: true,
    clientsClaim: false,
    skipWaiting: false,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: { maxEntries: 10, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        // Cachear ÚNICAMENTE imágenes estructurales desde la raíz (iconos, SVGs del shell)
        // Ignorar todo lo que venga de /_next/image (donde podrían haber firmas S3/Supabase)
        urlPattern: /^\/(?:apple-icon|icon-[0-9]+|file|globe|window|next|vercel|favicon|icon)\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-assets',
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /.*/i,
        handler: 'NetworkOnly',
        options: {
          cacheName: 'network-only-fallback',
        }
      }
    ]
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
